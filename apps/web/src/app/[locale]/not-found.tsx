import { NotFoundHelp } from "@/components/common/not-found-help";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

const NotFoundPage: React.FC = async () => {
  const t = await getTranslations("common.notFound");

  return (
    <main className="max-w-container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
      <NotFoundHelp />
    </main>
  );
};

export default NotFoundPage;
