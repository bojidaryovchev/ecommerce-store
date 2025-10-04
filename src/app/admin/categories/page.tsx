import { getCategories } from "@/actions/get-categories.action";
import CategoriesList from "@/components/categories-list";
import CreateCategoryModal from "@/components/create-category-modal";
import type React from "react";

const CategoriesPage: React.FC = async () => {
  const result = await getCategories();

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-2">Manage your product categories</p>
        </div>
        <CreateCategoryModal />
      </div>

      {/* Categories List */}
      {result.success ? (
        <CategoriesList categories={result.data} />
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error loading categories</p>
          <p className="text-sm">{result.error}</p>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
