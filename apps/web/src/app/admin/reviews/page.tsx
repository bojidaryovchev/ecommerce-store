import { AdminReviewsHeader, ReviewsTableLoader } from "@/components/admin/reviews";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reviews | Admin",
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const AdminReviewsPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <AdminReviewsHeader>
      <Suspense key={page} fallback={<TableSkeleton />}>
        <ReviewsTableLoader page={page} />
      </Suspense>
    </AdminReviewsHeader>
  );
};

export default AdminReviewsPage;
