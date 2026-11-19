"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { compareStore } from "@/lib/compare-store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

export type CompareColumn = {
  id: string;
  slug: string;
  name: string;
  href: string;
  image: string | null;
  price: string | null;
};

export type CompareRow = { name: string; values: Array<string | null>; differs: boolean };

type Props = { columns: CompareColumn[]; rows: CompareRow[] };

/** The comparison table: one column per product, one row per characteristic, the differing rows marked. */
const CompareGrid: React.FC<Props> = ({ columns, rows }) => {
  const t = useTranslations("products.compare");
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shown = onlyDifferences ? rows.filter((row) => row.differs) : rows;

  const remove = (column: CompareColumn) => {
    compareStore.remove(column.id);
    const rest = (searchParams.get("p") ?? "")
      .split(",")
      .filter((slug) => slug && slug !== column.slug)
      .join(",");
    router.replace({ pathname, query: rest ? { p: rest } : {} }, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("title")}>
        <Button
          type="button"
          size="sm"
          variant={onlyDifferences ? "outline" : "secondary"}
          aria-pressed={!onlyDifferences}
          onClick={() => setOnlyDifferences(false)}
        >
          {t("all")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={onlyDifferences ? "secondary" : "outline"}
          aria-pressed={onlyDifferences}
          onClick={() => setOnlyDifferences(true)}
        >
          {t("onlyDifferences")}
        </Button>
      </div>
      {/* Wider than a phone with more than two products: the table scrolls sideways, the names column stays put. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                className="bg-background sticky left-0 z-10 w-24 border-b p-2 text-left align-bottom sm:w-40 sm:p-3"
                scope="col"
              >
                <span className="sr-only">{t("title")}</span>
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="min-w-36 border-b p-2 text-left align-top font-normal sm:min-w-44 sm:p-3"
                >
                  <div className="relative space-y-2">
                    <button
                      type="button"
                      onClick={() => remove(column)}
                      aria-label={`${t("removeColumn")}: ${column.name}`}
                      title={t("removeColumn")}
                      className="bg-background/90 text-muted-foreground hover:text-foreground absolute top-1 right-1 z-10 grid size-7 place-items-center rounded-full border"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                    <div className="relative aspect-square w-full max-w-40 overflow-hidden rounded-xl border bg-white">
                      {column.image && (
                        <Image src={column.image} alt="" fill sizes="160px" className="object-contain p-3" />
                      )}
                    </div>
                    <Link href={column.href} className="line-clamp-3 font-medium hover:underline">
                      {column.name}
                    </Link>
                    {column.price && <p className="text-primary text-base font-bold tabular-nums">{column.price}</p>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.name} className={cn(row.differs && "bg-amber-50/60 dark:bg-amber-950/30")}>
                <th
                  scope="row"
                  className={cn(
                    "bg-background sticky left-0 z-10 border-b p-2 text-left align-top text-xs font-normal sm:p-3 sm:text-sm",
                    row.differs ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {row.name}
                  {row.differs && <span className="sr-only"> ({t("differs")})</span>}
                </th>
                {row.values.map((value, index) => (
                  <td key={columns[index]!.id} className="border-b p-2 align-top sm:p-3">
                    {value ?? <span className="text-muted-foreground">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { CompareGrid };
