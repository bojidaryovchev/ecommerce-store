import { CategoryFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Edit Category | Admin",
};

interface Props {
  params: Promise<{ id: string }>;
}

const EditCategoryPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Category</h1>
      <Suspense fallback={<FormSkeleton rows={5} />}>
        <CategoryFormLoader categoryId={id} />
      </Suspense>
    </div>
  );
};

export default EditCategoryPage;
