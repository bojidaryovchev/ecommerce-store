import * as schema from "@ecommerce/database/schema";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "../types";
import { STAGES, type Stage } from "./state";

/** Where the catalogue stands in the pipeline: counts per stage and status, and every product that needs a person. */
export interface EnrichReport {
  products: number;
  stages: Record<Stage, Record<string, number>>;
  flagged: Array<{ slug: string | null; name: string; problems: string[] }>;
  failed: Array<{ slug: string | null; name: string; stage: Stage; attempts: number; error: string }>;
}

export async function enrichReport(db: DbExecutor): Promise<EnrichReport> {
  const [products, rows] = await Promise.all([
    db.select({ id: schema.products.id, slug: schema.products.slug, name: schema.products.name }).from(schema.products),
    db
      .select({
        productId: schema.productEnrichments.productId,
        stage: schema.productEnrichments.stage,
        status: schema.productEnrichments.status,
        errors: schema.productEnrichments.errors,
        attempts: schema.productEnrichments.attempts,
      })
      .from(schema.productEnrichments)
      .innerJoin(schema.products, eq(schema.products.id, schema.productEnrichments.productId)),
  ]);
  const byId = new Map(products.map((product) => [product.id, product]));
  const stages = Object.fromEntries(
    STAGES.map((stage) => [stage, {} as Record<string, number>]),
  ) as EnrichReport["stages"];
  const flagged = new Map<string, EnrichReport["flagged"][number]>();
  const failed: EnrichReport["failed"] = [];

  for (const row of rows) {
    stages[row.stage][row.status] = (stages[row.stage][row.status] ?? 0) + 1;
    const product = byId.get(row.productId)!;
    if (row.status === "flagged") {
      const entry = flagged.get(row.productId) ?? { slug: product.slug, name: product.name, problems: [] };
      entry.problems.push(...row.errors);
      flagged.set(row.productId, entry);
    }
    if (row.status === "failed") {
      failed.push({
        slug: product.slug,
        name: product.name,
        stage: row.stage,
        attempts: row.attempts,
        error: row.errors[0] ?? "failed",
      });
    }
  }
  for (const stage of STAGES) {
    const done = Object.values(stages[stage]).reduce((sum, n) => sum + n, 0);
    if (products.length - done > 0) stages[stage]["not run"] = products.length - done;
  }
  return {
    products: products.length,
    stages,
    flagged: [...flagged.values()].sort((a, b) => a.name.localeCompare(b.name, "bg")),
    failed: failed.sort((a, b) => a.name.localeCompare(b.name, "bg")),
  };
}

export function formatReport(report: EnrichReport): string {
  const lines = [`Catalogue enrichment: ${report.products} products`, ""];
  for (const stage of STAGES) {
    const counts = Object.entries(report.stages[stage])
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([status, count]) => `${status} ${count}`)
      .join(", ");
    lines.push(`  ${stage.padEnd(9)} ${counts || "-"}`);
  }
  if (report.flagged.length > 0) {
    lines.push("", `Flagged for review (${report.flagged.length}):`);
    for (const item of report.flagged) {
      lines.push(`  ${item.slug ?? item.name}`);
      for (const problem of [...new Set(item.problems)]) lines.push(`    - ${problem}`);
    }
  }
  if (report.failed.length > 0) {
    lines.push("", `Failed (${report.failed.length}):`);
    for (const item of report.failed) {
      lines.push(`  ${item.slug ?? item.name} [${item.stage}, ${item.attempts}x]: ${item.error.slice(0, 200)}`);
    }
  }
  return lines.join("\n");
}
