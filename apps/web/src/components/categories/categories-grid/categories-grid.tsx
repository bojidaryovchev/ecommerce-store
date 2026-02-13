import type { Category } from "@ecommerce/database/schema";
import React from "react";
import { CategoryCard } from "./category-card";

interface Props {
  categories: Category[];
}

const CategoriesGrid: React.FC<Props> = ({ categories }) => {
  if (categories.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No categories found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
};

export { CategoriesGrid };
