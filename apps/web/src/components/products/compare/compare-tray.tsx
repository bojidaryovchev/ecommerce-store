"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { compareStore, useCompareList } from "@/lib/compare-store";
import { GitCompareArrows, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

/**
 * The visitor's comparison list, floating at the bottom left while it has products: their photos, a link to the
 * comparison and a way to clear it. On phones it sits above the product page's buy bar. Not on the comparison
 * itself: the table is the list there, and the tray would cover its first column.
 */
const CompareTray: React.FC = () => {
  const t = useTranslations("products.compare");
  const list = useCompareList();
  const pathname = usePathname();
  if (list.length === 0 || pathname === "/sravnenie") return null;

  return (
    <div className="bg-background/95 fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-[max(1rem,env(safe-area-inset-left,0px))] z-40 flex items-center gap-2 rounded-full border p-1.5 pr-2 shadow-lg backdrop-blur lg:bottom-6">
      <ul className="flex -space-x-2 pl-1" aria-hidden>
        {list.map((item) => (
          <li key={item.id} className="relative size-8 overflow-hidden rounded-full border-2 border-white bg-white">
            {item.image && <Image src={item.image} alt="" fill sizes="32px" className="object-contain" />}
          </li>
        ))}
      </ul>
      <Link
        href={{ pathname: "/sravnenie", query: { p: list.map((item) => item.slug).join(",") } }}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
      >
        <GitCompareArrows className="size-4" aria-hidden />
        {t("tray", { count: list.length })}
      </Link>
      <button
        type="button"
        onClick={() => compareStore.clear()}
        aria-label={t("clear")}
        title={t("clear")}
        className="text-muted-foreground hover:text-foreground grid size-7 place-items-center rounded-full"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
};

export { CompareTray };
