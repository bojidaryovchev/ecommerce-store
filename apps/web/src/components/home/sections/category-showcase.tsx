import { Reveal } from "@/components/motion";
import { Link } from "@/i18n/navigation";
import { buildCategoryMenu } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex, getCategoryStats } from "@/queries/categories";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import React from "react";
import { SectionHeading } from "./section-heading";

/** Every top-level category as a picture tile, with how many products it holds. */
const CategoryShowcase: React.FC = async () => {
  const [index, stats, t, tn] = await Promise.all([
    getCategoryIndex(),
    getCategoryStats(),
    getTranslations("home.categories"),
    getTranslations("navigation.navbar"),
  ]);
  const menu = buildCategoryMenu(index, categoryHref, stats);
  const total = menu.reduce((sum, root) => sum + root.productCount, 0);

  return (
    <Reveal as="section" className="max-w-container py-16 md:py-20" stagger={0.05}>
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description", { count: total, categories: menu.length })}
        link={{ href: "/produkti", label: t("viewAll") }}
      />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
        {menu.map((root) => (
          <li key={root.id} data-reveal>
            <Link
              href={root.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200 text-white"
            >
              {root.image && (
                <Image
                  src={root.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 250px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent transition-opacity group-hover:from-slate-950/90"
              />
              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="block leading-snug font-semibold text-balance">{root.name}</span>
                <span className="mt-1 block text-xs text-white/75">
                  {tn("productCount", { count: root.productCount })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
};

export { CategoryShowcase };
