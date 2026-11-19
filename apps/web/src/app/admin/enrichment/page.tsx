import { EnrichmentList } from "@/components/admin/enrichment";
import { TableSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ENRICHMENT_TABS, type EnrichmentTab } from "@/queries/enrichment";
import type { Metadata } from "next";
import Link from "next/link";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Catalogue enrichment | Admin",
};

type Props = {
  searchParams: Promise<{ tab?: string; page?: string; q?: string }>;
};

const AdminEnrichmentPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const tab = (ENRICHMENT_TABS as readonly string[]).includes(params.tab ?? "")
    ? (params.tab as EnrichmentTab)
    : "attention";
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catalogue enrichment</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Every supplier product goes through research (specs from the supplier&apos;s text, images and the
            manufacturer&apos;s data), validation, classification and a rewrite in the shop&apos;s own words. Nothing
            goes live until it is approved here; approved fields are locked against the supplier sync.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
      <Suspense key={`${tab}-${page}-${query}`} fallback={<TableSkeleton />}>
        <EnrichmentList tab={tab} page={page} query={query} />
      </Suspense>
    </div>
  );
};

export default AdminEnrichmentPage;
