/**
 * Rewrites the supplier's product descriptions into the shop's own copy (see rewrite.ts), against
 * DATABASE_URL, with ANTHROPIC_API_KEY (or an `ant auth login` profile).
 *
 *   pnpm --filter @ecommerce/supplier-sync rewrite --preview              # print one request, call nothing
 *   pnpm --filter @ecommerce/supplier-sync rewrite --limit 5 --dry-run    # rewrite 5, print, save nothing
 *   pnpm --filter @ecommerce/supplier-sync rewrite --limit 20             # rewrite and save 20
 *   pnpm --filter @ecommerce/supplier-sync rewrite --category termopompi-monoblok
 *   pnpm --filter @ecommerce/supplier-sync rewrite                        # every product still on supplier text
 *
 * After saving, set SITE_URL and SUPPLIER_SYNC_SECRET to have the live site refresh those product
 * pages (POST /api/revalidate); otherwise they refresh on the next deploy or catalog sync.
 */
import Anthropic from "@anthropic-ai/sdk";
import * as schema from "@ecommerce/database/schema";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import postgres from "postgres";
import { productsToRewrite, rewriteOne, rewritePrompt, saveRewrite, type ProductForRewrite } from "./rewrite";

loadEnv({ path: resolve(import.meta.dirname, "../../../../.env"), quiet: true });
loadEnv({ quiet: true });

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    category: { type: "string" },
    concurrency: { type: "string", default: "4" },
    "dry-run": { type: "boolean", default: false },
    preview: { type: "boolean", default: false },
  },
});

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const client = postgres(url, { max: 4 });
const db = drizzle(client, { schema });

try {
  const products = await productsToRewrite(db, {
    limit: values.limit ? Number(values.limit) : undefined,
    categorySlug: values.category,
  });
  console.log(`${products.length} product(s) still on the supplier's description.`);
  if (values.preview) {
    const first = products[0];
    if (first) console.log(`\n--- request for ${first.name} ---\n${rewritePrompt(first)}`);
  } else if (products.length > 0) {
    await run(products);
  }
} finally {
  await client.end();
}

async function run(products: ProductForRewrite[]) {
  const anthropic = new Anthropic();
  const saved: string[] = [];
  const failed: Array<{ name: string; error: string }> = [];
  let next = 0;

  const worker = async () => {
    while (next < products.length) {
      const product = products[next++]!;
      try {
        const copy = await rewriteOne(anthropic, product);
        if (values["dry-run"]) {
          console.log(`\n=== ${product.name}\n${copy.description}\n--- meta: ${copy.metaDescription}`);
        } else {
          await saveRewrite(db, product.id, copy);
          saved.push(product.id);
          console.log(`✓ ${product.name}`);
        }
      } catch (error) {
        const message =
          error instanceof Anthropic.RateLimitError
            ? "rate limited"
            : error instanceof Anthropic.APIError
              ? `API ${error.status}: ${error.message}`
              : error instanceof Error
                ? error.message
                : String(error);
        failed.push({ name: product.name, error: message });
        console.log(`✗ ${product.name}: ${message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Number(values.concurrency) || 4) }, worker));

  console.log(
    `\n${saved.length} saved, ${failed.length} failed${values["dry-run"] ? " (dry run: nothing saved)" : ""}.`,
  );
  if (failed.length > 0) console.log("Run again to retry the failed ones; saved products are skipped.");

  const site = process.env.SITE_URL?.replace(/\/+$/, "");
  const secret = process.env.SUPPLIER_SYNC_SECRET;
  if (saved.length > 0 && site && secret) {
    const response = await fetch(`${site}/api/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: saved }),
    }).catch((error: unknown) => ({ ok: false, status: String(error) }) as const);
    console.log(response.ok ? "The site refreshed those pages." : `The site did not refresh (${response.status}).`);
  }
  process.exitCode = failed.length > 0 ? 1 : 0;
}
