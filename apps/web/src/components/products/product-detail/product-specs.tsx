import { useTranslations } from "next-intl";
import React from "react";

type SpecValue = {
  value: string;
  attribute: { id: string; name: string; sortOrder: number };
};

interface Props {
  brand: string | null;
  values: SpecValue[];
}

/** Attribute names come from the supplier in lowercase ("мощност отопление kW"). */
const label = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Specifications table built from the product's attribute values (several values of one attribute share a row). */
const ProductSpecs: React.FC<Props> = ({ brand, values }) => {
  const t = useTranslations("products.detail");

  const rows = new Map<string, { name: string; sortOrder: number; values: string[] }>();
  for (const { value, attribute } of values) {
    const row = rows.get(attribute.id) ?? { name: label(attribute.name), sortOrder: attribute.sortOrder, values: [] };
    row.values.push(value);
    rows.set(attribute.id, row);
  }
  const sorted = [...rows.values()].sort((a, b) => a.sortOrder - b.sortOrder);

  if (!brand && sorted.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t("specifications")}</h2>
      <dl className="divide-border overflow-hidden rounded-lg border">
        {brand && (
          <div className="even:bg-muted/40 grid grid-cols-2 gap-4 px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{t("brand")}</dt>
            <dd className="font-medium">{brand}</dd>
          </div>
        )}
        {sorted.map((row) => (
          <div key={row.name} className="even:bg-muted/40 grid grid-cols-2 gap-4 px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{row.name}</dt>
            <dd className="font-medium">{row.values.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export { ProductSpecs };
