import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React from "react";

interface Props {
  title: string;
  link?: string;
  /** Defaults to the translated "View All". */
  linkText?: string;
}

const SectionHeader: React.FC<Props> = ({ title, link = "/categories", linkText }) => {
  const t = useTranslations("common.sectionHeader");

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold">{title}</h2>
      <Button asChild variant="ghost">
        <Link href={link}>{linkText ?? t("viewAll")} →</Link>
      </Button>
    </div>
  );
};

export { SectionHeader };
