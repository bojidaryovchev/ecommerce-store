"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

type PaginationProps = {
  page: number;
  pageCount: number;
};

/**
 * Generates an array of page numbers to display, with ellipsis gaps.
 * Always shows first, last, and pages around the current page.
 */
function getPageNumbers(page: number, pageCount: number): (number | "ellipsis")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (page > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (page < pageCount - 2) {
    pages.push("ellipsis");
  }

  pages.push(pageCount);

  return pages;
}

/**
 * Page links, real `<a href>`s so crawlers reach every page of a listing (and people can open one in a
 * new tab). The query is kept, only `page` changes; the path stays the current one, so storefront URLs
 * keep their locale prefix and the admin, outside the locale routing, works too.
 */
const Pagination: React.FC<PaginationProps> = ({ page, pageCount }) => {
  const t = useTranslations("common.pagination");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) {
    return null;
  }

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const step = (target: number, label: string, icon: React.ReactNode, rel?: "prev" | "next", className?: string) =>
    target < 1 || target > pageCount || target === page ? (
      <Button variant="ghost" size="icon" disabled aria-label={label} className={className}>
        {icon}
      </Button>
    ) : (
      <Button asChild variant="ghost" size="icon" className={className}>
        <NextLink href={hrefFor(target)} rel={rel} aria-label={label} scroll>
          {icon}
        </NextLink>
      </Button>
    );

  const pages = getPageNumbers(page, pageCount);

  return (
    <nav aria-label={t("label")} className="mt-8 flex flex-wrap items-center justify-center gap-1">
      {/* First and last are for wide screens; on a phone the numbers and arrows are enough. */}
      {step(1, t("first"), <ChevronsLeft className="h-4 w-4" />, undefined, "hidden sm:inline-flex")}
      {step(page - 1, t("previous"), <ChevronLeft className="h-4 w-4" />, "prev")}

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="text-muted-foreground px-2 text-sm">
            …
          </span>
        ) : p === page ? (
          <Button key={p} variant="default" size="icon" aria-current="page" aria-label={t("page", { page: p })} asChild>
            <span>{p}</span>
          </Button>
        ) : (
          <Button key={p} variant="ghost" size="icon" asChild>
            <NextLink href={hrefFor(p)} aria-label={t("page", { page: p })}>
              {p}
            </NextLink>
          </Button>
        ),
      )}

      {step(page + 1, t("next"), <ChevronRight className="h-4 w-4" />, "next")}
      {step(pageCount, t("last"), <ChevronsRight className="h-4 w-4" />, undefined, "hidden sm:inline-flex")}
    </nav>
  );
};

export { Pagination };
