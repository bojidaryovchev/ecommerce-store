import {
  CharacteristicsForm,
  EnrichmentReviewForm,
  StageBadges,
  VisibilityToggle,
  toReviewData,
} from "@/components/admin/enrichment";
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
  const missing = data.characteristics.missing.length;
  const contested = data.characteristics.contested.length;
  const filled = data.characteristics.filled.length;

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
        <div className="flex flex-wrap gap-2">
          <VisibilityToggle productId={data.productId} active={data.active} />
          <Button asChild variant="outline">
            <Link href="/admin/enrichment">Back to the list</Link>
          </Button>
        </div>
      </div>
      {!data.active && (
        <p className="rounded-lg border p-4 text-sm">
          Hidden from the shop: not listed, not sold and not indexed. Its page says the product is unavailable.
        </p>
      )}
      {(missing > 0 || contested > 0 || filled > 0) && (
        <section className="space-y-4 rounded-lg border border-amber-600/40 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">What this product lacks</h2>
            <p className="text-muted-foreground text-sm">
              {missing > 0 && "Nobody found these characteristics, the supplier nor the web research. "}
              {contested > 0 && "The supplier and the research disagree on these, so neither value is shown. "}
              Fill in what you know (from the manufacturer, a datasheet or the supplier), or hide the product from the
              shop. What you save shows in the shop at once; the next enrichment run writes it into the copy.
            </p>
          </div>
          {/* Keyed by what it shows: after a save the fields move (missing → filled) and the form starts afresh. */}
          <CharacteristicsForm
            key={JSON.stringify(data.characteristics)}
            productId={data.productId}
            characteristics={data.characteristics}
          />
        </section>
      )}
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
