import { Pagination } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ENRICHMENT_TABS, getEnrichmentList, type EnrichmentTab } from "@/queries/enrichment";
import { db } from "@ecommerce/database";
import { enrichReport } from "@ecommerce/supplier-sync/enrich";
import Link from "next/link";
import { connection } from "next/server";
import React from "react";
import { ApproveAllButton } from "./approve-all-button";
import { StageBadges } from "./stage-badges";

const TAB_LABELS: Record<EnrichmentTab, string> = {
  attention: "Needs attention",
  missing: "Missing details",
  ready: "Ready to publish",
  approved: "Published",
  hidden: "Hidden",
  waiting: "In progress",
  all: "All",
};

/** What each view is for, under the filters. */
const TAB_HINTS: Partial<Record<EnrichmentTab, string>> = {
  attention:
    "Not in the shop with its own text yet. Open one to fill in what is missing, or hide it from the shop. Values you fill in are written into the copy on the next enrichment run.",
  missing:
    "Characteristics nobody could find, or that the supplier and the research disagree on. Published products are here too: they are live without these figures.",
  hidden: "Taken out of the shop: not listed, not sold and not indexed. Their page says the product is unavailable.",
};

const STAGE_ORDER = ["extract", "validate", "classify", "rewrite", "review", "publish"] as const;

/** The pipeline's report and the products, grouped by what an admin has to do about them. */
const EnrichmentList: React.FC<{ tab: EnrichmentTab; page: number; query: string }> = async ({ tab, page, query }) => {
  await connection();
  const [list, report] = await Promise.all([getEnrichmentList({ tab, page, query }), enrichReport(db)]);
  const href = (next: Partial<{ tab: EnrichmentTab; q: string }>) => {
    const params = new URLSearchParams();
    params.set("tab", next.tab ?? tab);
    const q = next.q ?? query;
    if (q) params.set("q", q);
    return `/admin/enrichment?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Gate</th>
                <th className="px-3 py-2 text-left font-medium">Products</th>
              </tr>
            </thead>
            <tbody>
              {STAGE_ORDER.map((stage) => (
                <tr key={stage} className="border-t">
                  <td className="px-3 py-2 capitalize">{stage}</td>
                  <td className="text-muted-foreground px-3 py-2">
                    {Object.entries(report.stages[stage])
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([status, count]) => `${status} ${count}`)
                      .join(" · ") || "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ApproveAllButton ready={list.counts.ready} />
      </section>

      <section className="space-y-4">
        <nav className="flex flex-wrap gap-2" aria-label="Filter">
          {ENRICHMENT_TABS.map((value) => (
            <Link
              key={value}
              href={href({ tab: value })}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                value === tab ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
              )}
            >
              {TAB_LABELS[value]} <span className="opacity-70">{list.counts[value]}</span>
            </Link>
          ))}
        </nav>

        {TAB_HINTS[tab] && <p className="text-muted-foreground max-w-3xl text-sm">{TAB_HINTS[tab]}</p>}

        <form action="/admin/enrichment" className="max-w-sm">
          <input type="hidden" name="tab" value={tab} />
          <Input name="q" defaultValue={query} placeholder="Search by name or slug" aria-label="Search products" />
        </form>

        {list.rows.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground">Nothing here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PRODUCT</TableHead>
                <TableHead>WHAT TO DEAL WITH</TableHead>
                <TableHead>GATES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-sm whitespace-normal">
                    <Link href={`/admin/enrichment/${row.id}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                      {row.category ?? "No category"}
                      {row.published && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Live
                        </Badge>
                      )}
                      {!row.active && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Hidden
                        </Badge>
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-md text-sm whitespace-normal">
                    {row.reason ? (
                      <span className={row.reason.startsWith("Missing") ? "text-amber-900 dark:text-amber-200" : ""}>
                        {row.reason}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StageBadges stages={row.stages} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination page={list.page} pageCount={list.pageCount} />
      </section>
    </div>
  );
};

export { EnrichmentList };
