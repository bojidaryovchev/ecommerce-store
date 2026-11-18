import { Reveal } from "@/components/motion";
import { GUIDES, guideHref, guideText } from "@/content/guides";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import React from "react";
import { SectionHeading } from "./section-heading";

const GuidesTeaser: React.FC = async () => {
  const [t, locale] = await Promise.all([getTranslations("home.guides"), getLocale()]);
  const guides = GUIDES.slice(0, 3);
  if (guides.length === 0) return null;

  return (
    <Reveal as="section" className="max-w-container py-16 md:py-20">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} link={{ href: guideHref(), label: t("viewAll") }} />
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {guides.map((guide) => {
          const text = guideText(guide, locale);
          return (
            <li key={guide.slug} data-reveal>
              <Link href={guideHref(guide.slug)} className="group block">
                <span className="bg-muted relative block aspect-[16/10] overflow-hidden rounded-2xl">
                  <Image
                    src={guide.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </span>
                <span className="text-muted-foreground mt-4 flex items-center gap-1.5 text-xs">
                  <Clock className="size-3.5" aria-hidden />
                  {guide.readingMinutes} min
                </span>
                <span className="group-hover:text-primary mt-1.5 block text-lg leading-snug font-semibold transition-colors">
                  {text.title}
                </span>
                <span className="text-muted-foreground mt-2 line-clamp-2 block text-sm">{text.excerpt}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
};

export { GuidesTeaser };
