/**
 * Runs a supplier sync from the command line, against DATABASE_URL.
 *
 *   pnpm --filter @ecommerce/supplier-sync sync                # incremental
 *   pnpm --filter @ecommerce/supplier-sync sync --full         # download everything
 *   pnpm --filter @ecommerce/supplier-sync sync --full --publish  # first import: publish new products immediately
 *   pnpm --filter @ecommerce/supplier-sync sync --supplier hydroterm
 *   pnpm --filter @ecommerce/supplier-sync sync --apply-categories  # re-apply the curated category tree (src/curation.ts)
 */
import * as schema from "@ecommerce/database/schema";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import postgres from "postgres";
import { DEFAULT_SUPPLIER } from "./suppliers";
import { applyCategoryTree } from "./sync/curation";
import { runSupplierSync } from "./sync/run";

// Same .env files the database package uses: the repo root first, then the package's own.
loadEnv({ path: resolve(import.meta.dirname, "../../../.env"), quiet: true });
loadEnv({ quiet: true });

const { values } = parseArgs({
  options: {
    full: { type: "boolean", default: false },
    publish: { type: "boolean", default: false },
    supplier: { type: "string" },
    "apply-categories": { type: "boolean", default: false },
  },
});

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

try {
  if (values["apply-categories"]) {
    const result = await applyCategoryTree(db, values.supplier ?? DEFAULT_SUPPLIER);
    console.log(JSON.stringify(result, null, 2));
  } else {
    await sync();
  }
} finally {
  await client.end();
}

async function sync() {
  const result = await runSupplierSync({
    db,
    supplier: values.supplier,
    mode: values.full ? "full" : "incremental",
    trigger: "cli",
    publishNew: values.publish,
  });
  console.log(JSON.stringify({ status: result.status, message: result.message, stats: result.stats }, null, 2));
  if (result.errors.length > 0) console.log("First errors:", result.errors.slice(0, 10));
  process.exitCode = result.status === "failed" ? 1 : 0;
}
