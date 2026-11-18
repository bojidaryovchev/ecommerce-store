import { NotFoundHelp } from "@/components/common/not-found-help";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

const NotFound: React.FC = async () => {
  const t = await getTranslations("categories.notFound");

  return (
    <main className="max-w-container py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">{t("description")}</p>
      <Button asChild size="lg">
        <Link href="/categories">{t("browseAll")}</Link>
      </Button>
      <NotFoundHelp />
    </main>
  );
};

export default NotFound;
