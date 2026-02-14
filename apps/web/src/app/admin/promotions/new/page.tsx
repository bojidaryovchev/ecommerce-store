import { PromotionFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "New Promotion Code | Admin",
};

const NewPromotionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Promotion Code</h1>
      <Suspense fallback={<FormSkeleton rows={5} />}>
        <PromotionFormLoader />
      </Suspense>
    </div>
  );
};

export default NewPromotionPage;
