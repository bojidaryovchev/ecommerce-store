import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

const ProductNotFound: React.FC = async () => {
  const t = await getTranslations("products.notFound");

  return (
    <main className="max-w-container py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mb-8">{t("description")}</p>
        <Button asChild>
          <Link href="/products">{t("browseProducts")}</Link>
        </Button>
      </div>
    </main>
  );
};

export default ProductNotFound;
