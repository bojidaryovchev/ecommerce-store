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
  review: "Needs review",
  ready: "Ready to approve",
  approved: "Published",
  failed: "Failed",
  waiting: "Not done yet",
  all: "All",
};

const STAGE_ORDER = ["extract", "validate", "classify", "rewrite", "publish"] as const;

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
                <TableHead>GATES</TableHead>
                <TableHead>PROBLEMS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-md whitespace-normal">
                    <Link href={`/admin/enrichment/${row.id}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {row.category ?? "No category"}
                      {!row.active && " · unpublished"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StageBadges stages={row.stages} />
                  </TableCell>
                  <TableCell>
                    {row.problems > 0 ? (
                      <Badge variant="outline" className="border-amber-600/40 text-amber-900 dark:text-amber-200">
                        {row.problems}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">–</span>
                    )}
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
