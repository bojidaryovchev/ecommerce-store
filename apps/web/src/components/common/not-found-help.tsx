import { Link } from "@/i18n/navigation";
import { buildCategoryMenu } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex, getCategoryStats } from "@/queries/categories";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import React from "react";

/** Under every "not found" page: the catalog's sections as picture links, and the way to ask us. */
const NotFoundHelp: React.FC = async () => {
  const [index, stats, t] = await Promise.all([
    getCategoryIndex(),
    getCategoryStats(),
    getTranslations("common.notFound"),
  ]);
  const roots = buildCategoryMenu(index, categoryHref, stats);

  return (
    <section className="mx-auto mt-14 w-full max-w-5xl text-left">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">{t("browse")}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {roots.map((root) => (
          <li key={root.id}>
            <Link
              href={root.href}
              className="hover:bg-muted/60 flex items-center gap-3 rounded-xl border p-2 transition-colors"
            >
              <span className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-lg">
                {root.image && <Image src={root.image} alt="" fill sizes="48px" className="object-cover" />}
              </span>
              <span className="min-w-0 text-sm leading-snug font-medium break-words hyphens-auto">{root.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-8 text-sm">
        {t("help")}{" "}
        <Link href="/kontakti" className="text-primary font-semibold hover:underline">
          {t("contact")}
        </Link>
      </p>
    </section>
  );
};

export { NotFoundHelp };
