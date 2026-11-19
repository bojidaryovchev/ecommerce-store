import { CategoryFaqLoader, CategoryFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Edit Category | Admin",
};

interface Props {
  params: Promise<{ id: string }>;
}

/** Inside the page's Suspense: `params` is request data, so reading it outside would block the whole page. */
const EditCategory: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <>
      <CategoryFormLoader categoryId={id} />
      <Suspense fallback={<FormSkeleton rows={3} />}>
        <CategoryFaqLoader categoryId={id} />
      </Suspense>
    </>
  );
};

const EditCategoryPage: React.FC<Props> = ({ params }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Edit Category</h1>
    <Suspense fallback={<FormSkeleton rows={5} />}>
      <EditCategory params={params} />
    </Suspense>
  </div>
);

export default EditCategoryPage;
