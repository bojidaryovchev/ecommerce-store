import { z } from "zod";
import type { Logger } from "../logger";
import { silentLogger } from "../logger";
import { wpProductListingSchema, type WpProductListing } from "./schemas";

export interface WooCommerceClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  userAgent?: string;
  /** Pause after each request, to be gentle with the supplier's server. */
  delayMs?: number;
  timeoutMs?: number;
  /** Extra attempts after a network error, timeout, 429 or 5xx. */
  retries?: number;
  logger?: Logger;
}

const PAGE_SIZE = 100;

class RetryableError extends Error {}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Read-only client for a WooCommerce shop's public APIs. No key is needed: the Store API
 * (wc/store/v1) serves what the shop's own pages show, and wp/v2 lists edit times.
 */
export class WooCommerceClient {
  private readonly fetchImpl: typeof fetch;
  private readonly delayMs: number;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly logger: Logger;

  constructor(private readonly options: WooCommerceClientOptions) {
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.delayMs = options.delayMs ?? 250;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.retries = options.retries ?? 3;
    this.logger = options.logger ?? silentLogger;
  }

  /** All product categories (raw objects). */
  listCategories(): Promise<unknown[]> {
    return this.paginate("/wp-json/wc/store/v1/products/categories", {});
  }

  /** Every product the shop shows (raw Store API objects). */
  listProducts(): Promise<unknown[]> {
    return this.paginate("/wp-json/wc/store/v1/products", { orderby: "id", order: "asc" });
  }

  /** The given products (raw Store API objects); ids the shop no longer shows are simply absent. */
  async getProducts(ids: number[]): Promise<unknown[]> {
    const results: unknown[] = [];
    for (let i = 0; i < ids.length; i += PAGE_SIZE) {
      const batch = ids.slice(i, i + PAGE_SIZE);
      const { body } = await this.request("/wp-json/wc/store/v1/products", {
        include: batch.join(","),
        per_page: PAGE_SIZE,
      });
      results.push(...this.asArray(body));
    }
    return results;
  }

  /** Id and last edit time of every published product: cheap enough to call on every run. */
  async listProductEditTimes(): Promise<WpProductListing[]> {
    const raw = await this.paginate("/wp-json/wp/v2/product", {
      _fields: "id,modified_gmt",
      orderby: "id",
      order: "asc",
    });
    return z.array(wpProductListingSchema).parse(raw);
  }

  private async paginate(path: string, params: Record<string, string | number>): Promise<unknown[]> {
    const items: unknown[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const result = await this.request(path, { ...params, per_page: PAGE_SIZE, page });
      items.push(...this.asArray(result.body));
      totalPages = result.totalPages;
      page += 1;
    } while (page <= totalPages);
    return items;
  }

  private asArray(body: unknown): unknown[] {
    if (!Array.isArray(body)) {
      throw new Error("Unexpected response from the supplier API: expected a JSON array");
    }
    return body;
  }

  private async request(
    path: string,
    params: Record<string, string | number>,
  ): Promise<{ body: unknown; totalPages: number }> {
    const url = new URL(path, this.options.baseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    // The supplier's server marks API responses cacheable for a year; make sure no cache answers.
    url.searchParams.set("_", String(Date.now()));

    for (let attempt = 0; ; attempt++) {
      try {
        const response = await this.fetchImpl(url, {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "User-Agent": this.options.userAgent ?? "catalog-sync/1.0",
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (response.status === 429 || response.status >= 500) {
          throw new RetryableError(`HTTP ${response.status} from ${url.pathname}`);
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from ${url.pathname}`);
        }
        const body: unknown = await response.json();
        const totalPages = Number(response.headers.get("x-wp-totalpages") ?? "1");
        if (this.delayMs > 0) await sleep(this.delayMs);
        return { body, totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1 };
      } catch (error) {
        const retryable =
          error instanceof RetryableError ||
          (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) ||
          error instanceof TypeError; // network failure in fetch
        if (!retryable || attempt >= this.retries) throw error;
        const waitMs = 1000 * 3 ** attempt;
        this.logger.warn(`Request failed, retrying in ${waitMs} ms`, {
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(waitMs);
      }
    }
  }
}
