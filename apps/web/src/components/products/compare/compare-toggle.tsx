"use client";

import { Button } from "@/components/ui/button";
import { COMPARE_LIMIT } from "@/lib/compare-limit";
import { compareStore, useCompareList, type CompareItem } from "@/lib/compare-store";
import { cn } from "@/lib/utils";
import { GitCompareArrows } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import toast from "react-hot-toast";

type Props = {
  item: CompareItem;
  /** "icon": a round button on a card's photo; "button": a labelled button on the product page. */
  variant?: "icon" | "button";
};

/** Puts the product on the visitor's comparison list, or takes it off. */
const CompareToggle: React.FC<Props> = ({ item, variant = "button" }) => {
  const t = useTranslations("products.compare");
  const list = useCompareList();
  const selected = list.some((entry) => entry.id === item.id);

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const result = compareStore.toggle(item);
    // One toast that each click replaces, not a stack of them.
    if (result === "full") toast.error(t("full", { max: COMPARE_LIMIT }), { id: "compare" });
    else toast.success(t(result), { id: "compare" });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={selected}
        aria-label={selected ? t("remove") : t("add")}
        title={selected ? t("remove") : t("add")}
        className={cn(
          "absolute top-2 right-2 z-10 grid size-8 place-items-center rounded-full shadow-sm backdrop-blur-sm transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-white/80 text-gray-600 hover:bg-white",
        )}
      >
        <GitCompareArrows className="size-4" aria-hidden />
      </button>
    );
  }
  return (
    <Button type="button" variant={selected ? "secondary" : "outline"} onClick={toggle} aria-pressed={selected}>
      <GitCompareArrows className="mr-2 size-4" aria-hidden />
      {selected ? t("remove") : t("add")}
    </Button>
  );
};

export { CompareToggle };
