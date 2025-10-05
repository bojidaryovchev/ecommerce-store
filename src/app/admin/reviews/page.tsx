import { AdminReviewsClient } from "@/components/admin-reviews-client";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Reviews - Admin",
  description: "Moderate and manage product reviews",
};

const ReviewsPage: React.FC = () => {
  return <AdminReviewsClient />;
};

export default ReviewsPage;
