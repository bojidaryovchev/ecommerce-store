import { ProductFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Edit Product | Admin",
};

interface Props {
  params: Promise<{ id: string }>;
}

const EditProductPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Product</h1>
      <Suspense fallback={<FormSkeleton />}>
        <ProductFormLoader productId={id} />
      </Suspense>
    </div>
  );
};

export default EditProductPage;
