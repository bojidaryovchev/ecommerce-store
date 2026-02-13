import { ProductFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "New Product | Admin",
};

const NewProductPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Product</h1>
      <Suspense fallback={<FormSkeleton />}>
        <ProductFormLoader />
      </Suspense>
    </div>
  );
};

export default NewProductPage;
