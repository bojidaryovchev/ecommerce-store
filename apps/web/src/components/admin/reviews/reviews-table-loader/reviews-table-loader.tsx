import { Pagination } from "@/components/common/pagination";
import { getAllReviews } from "@/queries/reviews";
import React from "react";
import { ReviewsTable } from "./reviews-table";

type Props = {
  page?: number;
};

const ReviewsTableLoader: React.FC<Props> = async ({ page = 1 }) => {
  const { data: reviews, pageCount } = await getAllReviews({ page });

  return (
    <>
      <ReviewsTable reviews={reviews} />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { ReviewsTableLoader };
