import { CategoryFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import React, { Suspense } from "react";

const NewCategoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Category</h1>
      <Suspense fallback={<FormSkeleton rows={5} />}>
        <CategoryFormLoader />
      </Suspense>
    </div>
  );
};

export default NewCategoryPage;
