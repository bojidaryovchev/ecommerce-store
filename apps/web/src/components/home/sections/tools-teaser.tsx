import { Reveal } from "@/components/motion";
import { Link } from "@/i18n/navigation";
import { AirVent, ArrowRight, Heater, ThermometerSun } from "lucide-react";
import { getTranslations } from "next-intl/server";
import React from "react";
import { SectionHeading } from "./section-heading";

const TOOLS = [
  { key: "termopompa", Icon: ThermometerSun },
  { key: "klimatik", Icon: AirVent },
  { key: "radiatori", Icon: Heater },
] as const;

const ToolsTeaser: React.FC = async () => {
  const t = await getTranslations("home.tools");
  return (
    <Reveal as="section" className="max-w-container py-16 md:py-20">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {TOOLS.map(({ key, Icon }) => (
          <li key={key} data-reveal>
            <Link
              href={`/kalkulatori/${key}`}
              className="group bg-muted/50 hover:bg-background hover:border-primary/20 flex h-full flex-col rounded-2xl border border-transparent p-6 transition-all hover:shadow-xl hover:shadow-black/5"
            >
              <span className="bg-background text-primary grid size-12 place-items-center rounded-xl shadow-sm">
                <Icon className="size-6" aria-hidden />
              </span>
              <span className="mt-5 block text-lg font-semibold">{t(`items.${key}.title`)}</span>
              <span className="text-muted-foreground mt-1 block text-sm">{t(`items.${key}.text`)}</span>
              <span className="text-primary mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
                {t("open")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
};

export { ToolsTeaser };
