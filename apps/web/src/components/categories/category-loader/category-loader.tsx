import { CategoryDetail } from "@/components/categories";
import { auth } from "@/lib/auth";
import { getCategoryBySlug } from "@/queries/categories";
import { getWishlistProductIds } from "@/queries/wishlist";
import { notFound } from "next/navigation";
import React from "react";

interface Props {
  slug: string;
}

const CategoryLoader: React.FC<Props> = async ({ slug }) => {
  const [category, session] = await Promise.all([getCategoryBySlug(slug), auth()]);

  if (!category) {
    notFound();
  }

  const wishlistedProductIds = session?.user?.id ? await getWishlistProductIds(session.user.id) : undefined;

  return <CategoryDetail category={category} wishlistedProductIds={wishlistedProductIds} />;
};

export { CategoryLoader };
