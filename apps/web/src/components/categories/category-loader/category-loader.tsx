import { CategoryDetail } from "@/components/categories";
import { getCategoryBySlug } from "@/queries/categories";
import { notFound } from "next/navigation";
import React from "react";

interface Props {
  slug: string;
}

const CategoryLoader: React.FC<Props> = async ({ slug }) => {
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return <CategoryDetail category={category} />;
};

export { CategoryLoader };
