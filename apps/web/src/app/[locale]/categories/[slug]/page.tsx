import { permanentRedirect } from "@/i18n/navigation";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex } from "@/queries/categories";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/** Old category URLs (/categories/{slug}) moved permanently to /{category}/{subcategory}. */
const LegacyCategoryPage = async ({ params }: Props) => {
  const { locale, slug } = await params;
  const categories = await getCategoryIndex();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  permanentRedirect({ href: categoryHref(categoryTrail(categories, category.id)), locale });
};

export default LegacyCategoryPage;
