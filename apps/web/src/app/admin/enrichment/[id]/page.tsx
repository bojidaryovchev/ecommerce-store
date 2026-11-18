import { EnrichmentReviewForm, StageBadges, toReviewData } from "@/components/admin/enrichment";
import { TableSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { getEnrichmentDetail } from "@/queries/enrichment";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Review proposal | Admin",
};

type Props = {
  params: Promise<{ id: string }>;
};

const Review: React.FC<{ id: string }> = async ({ id }) => {
  const detail = await getEnrichmentDetail(id);
  if (!detail) notFound();
  const data = toReviewData(detail);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{data.current.name}</h1>
          <StageBadges stages={data.stages} />
          <div className="flex flex-wrap gap-4 text-sm">
            {data.slug && (
              <Link href={`/produkt/${data.slug}`} target="_blank" className="text-primary hover:underline">
                See it in the shop
              </Link>
            )}
            {data.supplierUrl && (
              <a href={data.supplierUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                See it at the supplier
              </a>
            )}
            <Link href={`/admin/products/${data.productId}`} className="text-primary hover:underline">
              Edit the product
            </Link>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/enrichment">Back to the list</Link>
        </Button>
      </div>
      <EnrichmentReviewForm data={data} />
    </div>
  );
};

const AdminEnrichmentReviewPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Review id={id} />
    </Suspense>
  );
};

export default AdminEnrichmentReviewPage;
