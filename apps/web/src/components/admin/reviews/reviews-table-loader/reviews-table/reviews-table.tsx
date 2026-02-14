"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { deleteReview } from "@/mutations/reviews";
import type { getAllReviews } from "@/queries/reviews";
import React, { useTransition } from "react";
import toast from "react-hot-toast";

type ReviewData = Awaited<ReturnType<typeof getAllReviews>>["data"];

interface Props {
  reviews: ReviewData;
}

const ReviewsTable: React.FC<Props> = ({ reviews }) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (reviewId: string) => {
    startTransition(async () => {
      const result = await deleteReview(reviewId);
      if (result.success) {
        toast.success("Review deleted");
      } else {
        toast.error(result.error);
      }
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground">No reviews found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>PRODUCT</TableHead>
          <TableHead>CUSTOMER</TableHead>
          <TableHead>RATING</TableHead>
          <TableHead>REVIEW</TableHead>
          <TableHead>DATE</TableHead>
          <TableHead>ACTIONS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell className="font-medium">{review.product?.name ?? "Deleted product"}</TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{review.user?.name ?? "Unknown"}</p>
                <p className="text-muted-foreground text-xs">{review.user?.email ?? ""}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                    ★
                  </span>
                ))}
              </div>
            </TableCell>
            <TableCell className="max-w-48 truncate">{review.content ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{formatDate(review.createdAt)}</TableCell>
            <TableCell>
              <Button variant="destructive" size="sm" disabled={isPending} onClick={() => handleDelete(review.id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export { ReviewsTable };
