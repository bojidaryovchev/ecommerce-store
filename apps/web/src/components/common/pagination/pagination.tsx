"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useTransition } from "react";

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

const Pagination: React.FC<PaginationProps> = ({ page, pageCount }) => {
  const t = useTranslations("common.pagination");
  // Plain next/navigation on purpose: this is also used in the admin, which is outside the locale routing.
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(newPage));
      }

      const queryString = params.toString();
      // Stays on the current path, so a storefront URL keeps its locale prefix (/en/…).
      startTransition(() => {
        router.push(queryString ? `?${queryString}` : window.location.pathname);
      });
    },
    [searchParams, router],
  );

  if (pageCount <= 1) {
    return null;
  }

  const pages = getPageNumbers(page, pageCount);

  return (
    <nav aria-label={t("label")} className="mt-8 flex items-center justify-center gap-1">
      {/* First page */}
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1 || isPending}
        onClick={() => navigate(1)}
        aria-label={t("first")}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous */}
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1 || isPending}
        onClick={() => navigate(page - 1)}
        aria-label={t("previous")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="text-muted-foreground px-2 text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="icon"
            disabled={isPending}
            onClick={() => navigate(p)}
            aria-label={t("page", { page: p })}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        ),
      )}

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        disabled={page >= pageCount || isPending}
        onClick={() => navigate(page + 1)}
        aria-label={t("next")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page */}
      <Button
        variant="ghost"
        size="icon"
        disabled={page >= pageCount || isPending}
        onClick={() => navigate(pageCount)}
        aria-label={t("last")}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};

export { Pagination };
