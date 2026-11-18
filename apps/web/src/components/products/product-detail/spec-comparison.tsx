import { getSpecRanges } from "@/queries/products";
import { getFormatter, getTranslations } from "next-intl/server";
import React from "react";

type SpecValue = {
  value: string;
  numericValue: number | null;
  attribute: { id: string; name: string; unit: string | null; sortOrder: number };
};

interface Props {
  rootCategoryId: string;
  rootCategoryName: string;
  values: SpecValue[];
}

/** Fewer models than this make a poor yardstick. */
const MIN_MODELS = 4;
const MAX_ROWS = 3;

const label = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Where the product stands among the other models of its section on each numeric specification
 * (power, heated area…): a scale from the section's lowest to its highest value with this model
 * marked, and how many models it exceeds. Like a shop's "how it compares" bars, from our own data.
 */
const SpecComparison: React.FC<Props> = async ({ rootCategoryId, rootCategoryName, values }) => {
  const [ranges, t, format] = await Promise.all([
    getSpecRanges(rootCategoryId),
    getTranslations("products.detail.comparison"),
    getFormatter(),
  ]);

  const seen = new Set<string>();
  const rows = values
    .filter((value) => value.numericValue !== null)
    .sort(
      (a, b) => a.attribute.sortOrder - b.attribute.sortOrder || a.attribute.name.localeCompare(b.attribute.name, "bg"),
    )
    .flatMap((value) => {
      if (seen.has(value.attribute.id)) return [];
      seen.add(value.attribute.id);
      const range = ranges[value.attribute.id];
      if (!range || range.values.length < MIN_MODELS) return [];
      const all = range.values;
      const min = all[0]!;
      const max = all[all.length - 1]!;
      if (min === max) return [];
      const own = value.numericValue!;
      return [
        {
          id: value.attribute.id,
          name: label(value.attribute.name),
          text: value.value,
          unit: range.unit ?? value.attribute.unit ?? "",
          position: Math.min(1, Math.max(0, (own - min) / (max - min))),
          min,
          max,
          below: all.filter((other) => other < own).length,
          others: all.length - 1,
        },
      ];
    })
    .slice(0, MAX_ROWS);

  if (rows.length === 0) return null;
  const number = (value: number) => format.number(value, { maximumFractionDigits: 2 });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("lead", { category: rootCategoryName })}</p>
      </div>
      <ul className="space-y-5">
        {rows.map((row) => (
          <li key={row.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{row.name}</span>
              <span className="font-semibold">{row.text}</span>
            </div>
            <div
              className="bg-muted relative mt-2 h-2 rounded-full"
              role="img"
              aria-label={t("aria", {
                name: row.name,
                value: row.text,
                min: number(row.min),
                max: number(row.max),
                unit: row.unit,
              })}
            >
              <div
                className="bg-primary/25 absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${row.position * 100}%` }}
              />
              <span
                className="bg-primary ring-background absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
                style={{ left: `${row.position * 100}%` }}
              />
            </div>
            <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
              <span>
                {number(row.min)} {row.unit}
              </span>
              <span>
                {number(row.max)} {row.unit}
              </span>
            </div>
            <p className="mt-1 text-xs">
              {row.below === row.others
                ? t("highest")
                : row.below === 0
                  ? t("lowest")
                  : t("higherThan", { below: row.below, others: row.others })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export { SpecComparison };
