import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React from "react";

const HomeHero: React.FC = () => {
  const t = useTranslations("home.hero");

  return (
    <section className="space-y-6 py-16 text-center">
      <h1 className="text-5xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mx-auto max-w-2xl text-xl">{t("description")}</p>
      <div className="flex justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/categories">{t("browseCategories")}</Link>
        </Button>
      </div>
    </section>
  );
};

export { HomeHero };
