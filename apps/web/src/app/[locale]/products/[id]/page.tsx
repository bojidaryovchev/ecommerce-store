import { permanentRedirect } from "@/i18n/navigation";
import { productHref } from "@/lib/routes";
import { getProductById } from "@/queries/products";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/** Old product URLs (/products/{id}) moved permanently to /produkt/{slug}. */
const LegacyProductPage = async ({ params }: Props) => {
  const { locale, id } = await params;
  const product = await getProductById(id);

  if (!product?.slug) {
    notFound();
  }

  permanentRedirect({ href: productHref(product), locale });
};

export default LegacyProductPage;
