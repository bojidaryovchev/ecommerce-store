"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@ecommerce/database/schema";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useTransition } from "react";

type ProductFiltersProps = {
  categories: Category[];
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc", label: "Name: A → Z" },
  { value: "name-desc", label: "Name: Z → A" },
] as const;

const ProductFilters: React.FC<ProductFiltersProps> = ({ categories }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const currentQuery = searchParams.get("q") ?? "";

  const hasFilters = currentCategory || currentSort || currentMinPrice || currentMaxPrice;

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const queryString = params.toString();
      startTransition(() => {
        router.push(queryString ? `/products?${queryString}` : "/products");
      });
    },
    [searchParams, router],
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      updateParams({ category: value === "all" ? "" : value });
    },
    [updateParams],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      updateParams({ sort: value === "newest" ? "" : value });
    },
    [updateParams],
  );

  const handleMinPriceBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      const cents = raw ? Math.round(parseFloat(raw) * 100) : 0;
      updateParams({ minPrice: cents > 0 ? String(cents) : "" });
    },
    [updateParams],
  );

  const handleMaxPriceBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      const cents = raw ? Math.round(parseFloat(raw) * 100) : 0;
      updateParams({ maxPrice: cents > 0 ? String(cents) : "" });
    },
    [updateParams],
  );

  const handleClearFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (currentQuery) {
      params.set("q", currentQuery);
    }

    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `/products?${queryString}` : "/products");
    });
  }, [currentQuery, router]);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Category filter */}
        <div className="w-44 space-y-1.5">
          <Label htmlFor="category-filter" className="text-xs font-medium">
            Category
          </Label>
          <Select value={currentCategory || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category-filter" className="h-9 w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price range */}
        <div className="flex items-end gap-2">
          <div className="w-28 space-y-1.5">
            <Label htmlFor="min-price" className="text-xs font-medium">
              Min Price
            </Label>
            <Input
              id="min-price"
              type="number"
              min={0}
              step={0.01}
              placeholder="$0"
              defaultValue={currentMinPrice ? (Number(currentMinPrice) / 100).toFixed(2) : ""}
              onBlur={handleMinPriceBlur}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="h-9"
            />
          </div>
          <span className="text-muted-foreground pb-2 text-sm">–</span>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="max-price" className="text-xs font-medium">
              Max Price
            </Label>
            <Input
              id="max-price"
              type="number"
              min={0}
              step={0.01}
              placeholder="Any"
              defaultValue={currentMaxPrice ? (Number(currentMaxPrice) / 100).toFixed(2) : ""}
              onBlur={handleMaxPriceBlur}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="h-9"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="w-44 space-y-1.5">
          <Label htmlFor="sort-select" className="text-xs font-medium">
            Sort By
          </Label>
          <Select value={currentSort || "newest"} onValueChange={handleSortChange}>
            <SelectTrigger id="sort-select" className="h-9 w-full">
              <SelectValue placeholder="Newest" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 gap-1.5">
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

export { ProductFilters };
