import { db, schema } from "@ecommerce/database";
import type { EnrichmentStage, EnrichmentStatus } from "@ecommerce/database/schema";
import { asc } from "drizzle-orm";
import { connection } from "next/server";

export const ENRICHMENT_TABS = ["review", "ready", "approved", "failed", "waiting", "all"] as const;
export type EnrichmentTab = (typeof ENRICHMENT_TABS)[number];

const PAGE_SIZE = 50;

export type EnrichmentRow = {
  id: string;
  slug: string | null;
  name: string;
  active: boolean;
  category: string | null;
  stages: Partial<Record<EnrichmentStage, EnrichmentStatus>>;
  problems: number;
  tab: Exclude<EnrichmentTab, "all">;
  updatedAt: Date | null;
};

/** Which tab a product belongs in: what an admin has to do about it. */
function tabOf(stages: EnrichmentRow["stages"]): EnrichmentRow["tab"] {
  if (stages.publish === "approved") return "approved";
  if (Object.values(stages).includes("failed")) return "failed";
  if (stages.validate === "flagged" || stages.classify === "flagged") return "review";
  if (stages.publish === "pending" && stages.rewrite === "succeeded") return "ready";
  return "waiting";
}

/**
 * Every product with where it stands in the enrichment pipeline (admin use). A few hundred products, so
 * the grouping is done here rather than in SQL. Always fresh: the pipeline writes from outside the app.
 */
async function getEnrichmentList(options: { tab?: EnrichmentTab; page?: number; query?: string } = {}) {
  await connection();
  const [products, stages] = await Promise.all([
    db.query.products.findMany({
      columns: { id: true, slug: true, name: true, active: true },
      with: { category: { columns: { name: true } } },
      orderBy: [asc(schema.products.name)],
    }),
    db
      .select({
        productId: schema.productEnrichments.productId,
        stage: schema.productEnrichments.stage,
        status: schema.productEnrichments.status,
        errors: schema.productEnrichments.errors,
        updatedAt: schema.productEnrichments.updatedAt,
      })
      .from(schema.productEnrichments),
  ]);

  const byProduct = new Map<string, typeof stages>();
  for (const row of stages) byProduct.set(row.productId, [...(byProduct.get(row.productId) ?? []), row]);

  const rows: EnrichmentRow[] = products.map((product) => {
    const own = byProduct.get(product.id) ?? [];
    const statuses = Object.fromEntries(own.map((row) => [row.stage, row.status])) as EnrichmentRow["stages"];
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      active: product.active,
      category: product.category?.name ?? null,
      stages: statuses,
      problems: own
        .filter((row) => row.stage === "validate" || row.stage === "classify")
        .reduce((sum, row) => sum + row.errors.length, 0),
      tab: tabOf(statuses),
      updatedAt: own.reduce<Date | null>(
        (latest, row) => (!latest || row.updatedAt > latest ? row.updatedAt : latest),
        null,
      ),
    };
  });

  const counts = Object.fromEntries(ENRICHMENT_TABS.map((tab) => [tab, 0])) as Record<EnrichmentTab, number>;
  for (const row of rows) counts[row.tab] += 1;
  counts.all = rows.length;

  const tab = options.tab ?? "review";
  const needle = options.query?.trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      (tab === "all" || row.tab === tab) &&
      (!needle || row.name.toLowerCase().includes(needle) || row.slug?.includes(needle)),
  );
  const page = Math.max(1, options.page ?? 1);
  return {
    rows: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    pageCount: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    counts,
  };
}

export { getEnrichmentList };
