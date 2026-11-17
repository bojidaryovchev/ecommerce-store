"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import {
  formatRange,
  hasActiveFilters,
  RANGE_PREFIX,
  VALUE_PREFIX,
  type CatalogFilters as Filters,
  type NumericRange,
} from "@/lib/catalog-filters";
import { cn } from "@/lib/utils";
import type { CatalogFacets, RangeFacet } from "@/queries/products";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { useCatalogNavigation } from "./use-catalog-navigation";

export type CatalogLink = { href: string; label: string };

export interface CatalogFiltersProps {
  facets: CatalogFacets;
  filters: Filters;
  basePath: string;
  links?: CatalogLink[];
  linksTitle?: string;
  className?: string;
}

const VISIBLE_OPTIONS = 8;

/** Attribute names come from the supplier in lowercase ("мощност отопление kW"). */
const label = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h3 className="text-sm font-semibold">{title}</h3>
    {children}
  </section>
);

const CheckboxList: React.FC<{
  name: string;
  options: Array<{ value: string; count: number }>;
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
  unit?: string | null;
  disabled?: boolean;
}> = ({ name, options, selected, onToggle, unit, disabled }) => {
  const t = useTranslations("catalog.filters");
  const [expanded, setExpanded] = useState(false);
  // Selected options always stay visible, even when the list is collapsed.
  const visible = expanded
    ? options
    : options.filter((option, index) => index < VISIBLE_OPTIONS || selected.includes(option.value));
  const hidden = options.length - visible.length;

  return (
    <div className="space-y-2">
      {visible.map((option) => {
        const id = `${name}-${option.value}`;
        const checked = selected.includes(option.value);
        return (
          <div key={option.value} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={checked}
              disabled={disabled}
              onCheckedChange={(state) => onToggle(option.value, state === true)}
            />
            <label htmlFor={id} className="flex flex-1 cursor-pointer items-baseline justify-between gap-2 text-sm">
              <span className={cn(checked && "font-medium")}>
                {option.value}
                {unit && !option.value.includes(unit) ? ` ${unit}` : ""}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">{option.count}</span>
            </label>
          </div>
        );
      })}
      {(hidden > 0 || expanded) && options.length > VISIBLE_OPTIONS && (
        <button
          type="button"
          className="text-primary text-sm font-medium hover:underline"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t("showLess") : t("showMore", { count: hidden })}
        </button>
      )}
    </div>
  );
};

/** Two number inputs; the URL updates when a field loses focus or Enter is pressed. */
const RangeInputs: React.FC<{
  name: string;
  bounds: { min: number; max: number };
  value: NumericRange | undefined;
  onChange: (range: NumericRange | null) => void;
  step?: number;
}> = ({ name, bounds, value, onChange, step = 1 }) => {
  const t = useTranslations("catalog.filters");
  const commit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const parse = (key: string) => {
      const raw = String(data.get(key) ?? "")
        .trim()
        .replace(",", ".");
      const n = Number(raw);
      return raw && Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    const min = parse("min");
    const max = parse("max");
    if (min === value?.min && max === value?.max) return;
    onChange(min === undefined && max === undefined ? null : { min, max });
  };

  return (
    <form
      // Re-mount when the URL changes so the inputs show the applied values.
      key={`${value?.min ?? ""}-${value?.max ?? ""}`}
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        commit(event.currentTarget);
      }}
      // Only when focus leaves both fields, so tabbing from "from" to "to" doesn't apply half a range.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit(event.currentTarget);
      }}
    >
      <Input
        name="min"
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        placeholder={`${t("from")} ${bounds.min}`}
        defaultValue={value?.min ?? ""}
        aria-label={`${name}: ${t("from")}`}
        className="h-9"
      />
      <span className="text-muted-foreground">–</span>
      <Input
        name="max"
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        placeholder={`${t("to")} ${bounds.max}`}
        defaultValue={value?.max ?? ""}
        aria-label={`${name}: ${t("to")}`}
        className="h-9"
      />
      {/* Enter submits the form */}
      <button type="submit" className="sr-only">
        OK
      </button>
    </form>
  );
};

const rangeStep = (facet: RangeFacet) => (facet.max - facet.min <= 20 ? 0.1 : 1);

/** The filter panel: in the sidebar on desktop, in a sheet on mobile. */
const CatalogFilters: React.FC<CatalogFiltersProps> = ({ facets, filters, basePath, links, linksTitle, className }) => {
  const t = useTranslations("catalog.filters");
  const { update, toggle, set, clear, isPending } = useCatalogNavigation(basePath);

  const euros = (cents: number) => Math.round(cents / 100);
  const priceValue: NumericRange | undefined =
    filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          ...(filters.minPrice !== undefined && { min: euros(filters.minPrice) }),
          ...(filters.maxPrice !== undefined && { max: euros(filters.maxPrice) }),
        }
      : undefined;

  return (
    <div className={cn("space-y-6", isPending && "opacity-60 transition-opacity", className)} aria-busy={isPending}>
      {hasActiveFilters(filters) && (
        <Button variant="outline" size="sm" className="w-full" onClick={clear}>
          {t("clearAll")}
        </Button>
      )}

      {links && links.length > 0 && (
        <Section title={linksTitle ?? t("categories")}>
          <ul className="space-y-1.5 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-primary hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {facets.inStock > 0 && facets.inStock < facets.total && (
        <Section title={t("availability")}>
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-in-stock"
              checked={filters.inStock}
              onCheckedChange={(state) => set("inStock", state === true ? "1" : null)}
            />
            <label htmlFor="filter-in-stock" className="flex flex-1 cursor-pointer justify-between text-sm">
              <span>{t("inStockOnly")}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{facets.inStock}</span>
            </label>
          </div>
        </Section>
      )}

      {facets.price && facets.price.max > facets.price.min && (
        <Section title={t("price")}>
          <RangeInputs
            name={t("price")}
            bounds={{ min: Math.floor(facets.price.min / 100), max: Math.ceil(facets.price.max / 100) }}
            value={priceValue}
            onChange={(range) =>
              update((params) => {
                if (range?.min !== undefined) params.set("minPrice", String(range.min));
                else params.delete("minPrice");
                if (range?.max !== undefined) params.set("maxPrice", String(range.max));
                else params.delete("maxPrice");
              })
            }
          />
        </Section>
      )}

      {facets.brands.length > 1 && (
        <Section title={t("brand")}>
          <CheckboxList
            name="brand"
            options={facets.brands}
            selected={filters.brands}
            onToggle={(value, checked) => toggle("brand", value, checked)}
          />
        </Section>
      )}

      {facets.attributes.map((facet) => (
        <React.Fragment key={facet.slug}>
          <Separator />
          <Section title={label(facet.name)}>
            {facet.kind === "values" ? (
              <CheckboxList
                name={facet.slug}
                options={facet.options}
                selected={filters.values[facet.slug] ?? []}
                onToggle={(value, checked) => toggle(`${VALUE_PREFIX}${facet.slug}`, value, checked)}
              />
            ) : (
              <RangeInputs
                name={label(facet.name)}
                bounds={{ min: facet.min, max: facet.max }}
                value={filters.ranges[facet.slug]}
                step={rangeStep(facet)}
                onChange={(range) => set(`${RANGE_PREFIX}${facet.slug}`, range ? formatRange(range) : null)}
              />
            )}
          </Section>
        </React.Fragment>
      ))}
    </div>
  );
};

export { CatalogFilters };
