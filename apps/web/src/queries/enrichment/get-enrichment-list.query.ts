import { db, schema } from "@ecommerce/database";
import type { EnrichmentStage, EnrichmentStatus } from "@ecommerce/database/schema";
import { productGaps, readValidate } from "@ecommerce/supplier-sync/enrich";
import { asc } from "drizzle-orm";
import { connection } from "next/server";

/**
 * The admin's views of the catalogue, by what there is to do:
 * - attention: not in the shop with its own text, and held (missing or contested data, the reviewer, a failure);
 * - missing: lacks a characteristic or has a contested one, whether published or not;
 * - labels: covered by the EU energy labelling rules, and the shop has no label or product fiche for it yet;
 * - ready: passed every check, waiting to be published;
 * - approved: in the shop with its own text;
 * - hidden: taken out of the shop by an admin (or withdrawn by the supplier);
 * - waiting: still going through the pipeline.
 * A product can be in more than one (a published towel rail without its output is in "approved" and "missing").
 */
export const ENRICHMENT_TABS = [
  "attention",
  "missing",
  "labels",
  "ready",
  "approved",
  "hidden",
  "waiting",
  "all",
] as const;
export type EnrichmentTab = (typeof ENRICHMENT_TABS)[number];

const PAGE_SIZE = 50;

export type EnrichmentRow = {
  id: string;
  slug: string | null;
  name: string;
  active: boolean;
  published: boolean;
  category: string | null;
  stages: Partial<Record<EnrichmentStage, EnrichmentStatus>>;
  /** What the admin has to deal with, in one line ("Missing: Топлинна мощност"). */
  reason: string | null;
  tabs: Array<Exclude<EnrichmentTab, "all">>;
  updatedAt: Date | null;
};

/**
 * Every product with where it stands in the enrichment pipeline (admin use). A few hundred products, so
 * the grouping is done here rather than in SQL. Always fresh: the pipeline writes from outside the app.
 */
async function getEnrichmentList(options: { tab?: EnrichmentTab; page?: number; query?: string } = {}) {
  await connection();
  const [products, stages] = await Promise.all([
    db.query.products.findMany({
      columns: { id: true, slug: true, name: true, active: true, lockedFields: true, media: true, metadata: true },
      with: {
        category: { columns: { name: true } },
        attributeValues: { columns: { value: true, source: true }, with: { attribute: { columns: { slug: true } } } },
      },
      orderBy: [asc(schema.products.name)],
    }),
    db
      .select({
        productId: schema.productEnrichments.productId,
        stage: schema.productEnrichments.stage,
        status: schema.productEnrichments.status,
        errors: schema.productEnrichments.errors,
        output: schema.productEnrichments.output,
        updatedAt: schema.productEnrichments.updatedAt,
      })
      .from(schema.productEnrichments),
  ]);

  const byProduct = new Map<string, typeof stages>();
  for (const row of stages) byProduct.set(row.productId, [...(byProduct.get(row.productId) ?? []), row]);

  const rows: EnrichmentRow[] = products.map((product) => {
    const own = byProduct.get(product.id) ?? [];
    const stage = (name: EnrichmentStage) => own.find((row) => row.stage === name);
    const statuses = Object.fromEntries(own.map((row) => [row.stage, row.status])) as EnrichmentRow["stages"];
    const gaps = productGaps(
      readValidate(stage("validate")?.output),
      product.attributeValues.map((value) => ({
        slug: value.attribute.slug,
        value: value.value,
        source: value.source,
      })),
      { media: product.media, metadata: product.metadata },
    );
    const published = product.lockedFields.includes("description");
    const review = stage("review");
    const rewrite = stage("rewrite");
    const reason =
      gaps.missing.length > 0
        ? `Missing: ${gaps.missing.map((gap) => gap.label).join("; ")}`
        : gaps.contested.length > 0
          ? `Contested: ${gaps.contested.map((gap) => gap.label).join("; ")}`
          : review?.status === "flagged" || review?.status === "failed"
            ? `Reviewer: ${review.errors[0] ?? "held"}`
            : rewrite?.status === "failed"
              ? `Copy: ${rewrite.errors[0] ?? "failed"}`
              : gaps.documents.length > 0
                ? `Needs: ${gaps.documents.map((gap) => gap.label.toLowerCase()).join(", ")}`
                : (stage("validate")?.errors[0] ?? null);
    const ready =
      !published &&
      statuses.publish === "pending" &&
      statuses.rewrite === "succeeded" &&
      statuses.review === "succeeded";
    const held =
      !published &&
      !ready &&
      (statuses.review === "flagged" ||
        statuses.review === "failed" ||
        statuses.rewrite === "failed" ||
        statuses.validate === "flagged" ||
        statuses.classify === "flagged");
    const tabs: EnrichmentRow["tabs"] = [];
    if (!product.active) tabs.push("hidden");
    else {
      if (held) tabs.push("attention");
      if (gaps.missing.length > 0 || gaps.contested.length > 0) tabs.push("missing");
      if (gaps.documents.length > 0) tabs.push("labels");
    }
    if (published) tabs.push("approved");
    else if (ready) tabs.push("ready");
    else if (!held) tabs.push("waiting");
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      active: product.active,
      published,
      category: product.category?.name ?? null,
      stages: statuses,
      reason: reason ? (reason.length > 180 ? `${reason.slice(0, 177).trimEnd()}…` : reason) : null,
      tabs,
      updatedAt: own.reduce<Date | null>(
        (latest, row) => (!latest || row.updatedAt > latest ? row.updatedAt : latest),
        null,
      ),
    };
  });

  const counts = Object.fromEntries(ENRICHMENT_TABS.map((tab) => [tab, 0])) as Record<EnrichmentTab, number>;
  for (const row of rows) for (const tab of row.tabs) counts[tab] += 1;
  counts.all = rows.length;

  const tab = options.tab ?? "attention";
  const needle = options.query?.trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      (tab === "all" || row.tabs.includes(tab)) &&
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
