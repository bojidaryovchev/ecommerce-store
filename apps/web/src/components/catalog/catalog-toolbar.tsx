"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CATALOG_SORTS, hasActiveFilters, type CatalogSort } from "@/lib/catalog-filters";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { CatalogFilters, type CatalogFiltersProps } from "./catalog-filters";
import { useCatalogNavigation } from "./use-catalog-navigation";

const SORT_KEYS: Record<CatalogSort, string> = {
  relevance: "relevance",
  newest: "newest",
  "price-asc": "priceAsc",
  "price-desc": "priceDesc",
  "name-asc": "nameAsc",
  "name-desc": "nameDesc",
};

interface Props extends CatalogFiltersProps {
  total: number;
}

const activeFilterCount = (filters: CatalogFiltersProps["filters"]) =>
  filters.brands.length +
  Object.values(filters.values).reduce((sum, values) => sum + values.length, 0) +
  Object.keys(filters.ranges).length +
  (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
  (filters.inStock ? 1 : 0);

/** Result count, sort order and (below the desktop breakpoint) the filters in a sheet. */
const CatalogToolbar: React.FC<Props> = ({ total, ...filterProps }) => {
  const t = useTranslations("catalog.toolbar");
  const tFilters = useTranslations("catalog.filters");
  const { set } = useCatalogNavigation(filterProps.basePath);
  const [open, setOpen] = useState(false);
  const { filters } = filterProps;

  const sorts = CATALOG_SORTS.filter((sort) => sort !== "relevance" || filters.query);
  const currentSort = filters.sort ?? (filters.query ? "relevance" : "newest");
  const active = activeFilterCount(filters);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />
              {t("openFilters")}
              {active > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{active}</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{tFilters("title")}</SheetTitle>
            </SheetHeader>
            <CatalogFilters {...filterProps} className="px-4 pb-6" />
          </SheetContent>
        </Sheet>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {t("count", { count: total })}
          {active > 0 && hasActiveFilters(filters) && (
            <span className="hidden sm:inline"> · {t("activeFilters", { count: active })}</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground hidden text-sm sm:inline">{t("sortLabel")}</span>
        <Select
          value={currentSort}
          onValueChange={(value) => set("sort", value === (filters.query ? "relevance" : "newest") ? null : value)}
        >
          <SelectTrigger className="h-9 w-48" aria-label={t("sortLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {t(`sort.${SORT_KEYS[sort]}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export { CatalogToolbar };
