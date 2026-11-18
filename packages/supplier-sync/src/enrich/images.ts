import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * The supplier's images, fetched once and kept in a local cache, resized for the model to look at: spec
 * tables and energy labels are often pictures, and only looking tells a product photo from a feature icon.
 *
 * Images are scaled to fit 1568 px (what the model reads at full detail) and stored as JPEG on white, which
 * every reader accepts and keeps text in tables legible.
 */

export interface PreparedImage {
  url: string;
  /** Relative to the workspace; null when the image could not be fetched or read. */
  file: string | null;
  /** The original's size. */
  width: number | null;
  height: number | null;
  error: string | null;
}

const MAX_SIDE = 1568;
const MAX_BYTES = 20 * 1024 * 1024;
const TIMEOUT_MS = 30_000;

export const urlKey = (url: string) => createHash("sha1").update(url).digest("hex");

type CacheEntry = { width: number; height: number };

async function fetchAndResize(
  url: string,
  target: string,
  fetchImpl: typeof fetch,
  userAgent: string,
): Promise<CacheEntry> {
  const response = await fetchImpl(url, {
    headers: { "User-Agent": userAgent, Accept: "image/*" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > MAX_BYTES) throw new Error(`too large (${length} bytes)`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error(`too large (${bytes.length} bytes)`);

  const image = sharp(bytes, { animated: false, failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error("not an image");
  await image
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 88 })
    .toFile(target);
  return { width, height };
}

/**
 * Fetch (or take from the cache) every image and copy it into `workspace/images`. Never throws: an image that
 * fails comes back with `file: null` and the reason.
 */
export async function prepareImages(
  urls: readonly string[],
  options: {
    workspace: string;
    cacheDir: string;
    fetch?: typeof fetch;
    userAgent?: string;
    concurrency?: number;
  },
): Promise<Map<string, PreparedImage>> {
  const fetchImpl = options.fetch ?? fetch;
  const userAgent = options.userAgent ?? "catalog-enrich/1.0";
  const imagesDir = path.join(options.workspace, "images");
  await mkdir(imagesDir, { recursive: true });
  await mkdir(options.cacheDir, { recursive: true });

  const unique = [...new Set(urls)];
  const prepared = new Map<string, PreparedImage>();
  let next = 0;

  const worker = async () => {
    while (next < unique.length) {
      const url = unique[next++]!;
      const key = urlKey(url);
      const cached = path.join(options.cacheDir, `${key}.jpg`);
      const sidecar = path.join(options.cacheDir, `${key}.json`);
      try {
        let entry: CacheEntry;
        try {
          entry = JSON.parse(await readFile(sidecar, "utf8")) as CacheEntry;
        } catch {
          entry = await fetchAndResize(url, cached, fetchImpl, userAgent);
          await writeFile(sidecar, JSON.stringify(entry), "utf8");
        }
        const file = `images/${key.slice(0, 12)}.jpg`;
        await copyFile(cached, path.join(options.workspace, file));
        prepared.set(url, { url, file, width: entry.width, height: entry.height, error: null });
      } catch (error) {
        prepared.set(url, {
          url,
          file: null,
          width: null,
          height: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, options.concurrency ?? 4) }, worker));
  return prepared;
}

/**
 * A guess from the size and file name alone, for images the model never sees (or to tell it what to expect).
 * Only the clear cases: a tiny square image is an icon; a file named after a certification is a badge.
 */
export function guessImageKind(url: string, width: number | null, height: number | null): "icon" | "badge" | null {
  const name = decodeURIComponent(url.split("/").pop() ?? "").toLowerCase();
  if (/(^|[^a-z])(ce|tuv|iso|ul|en-?\d+|classe-?energetica|energy-?label)([^a-z]|$)/.test(name)) return "badge";
  if (width !== null && height !== null && Math.max(width, height) <= 96) return "icon";
  if (/icon|icona|ikona/.test(name) && width !== null && height !== null && Math.max(width, height) <= 320) {
    return "icon";
  }
  return null;
}
