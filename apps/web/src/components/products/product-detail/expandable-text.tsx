"use client";

import { LinkedText } from "@/components/common/linked-text";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useId, useState } from "react";

/** Text longer than this starts folded. */
const FOLD_AT = 900;

/**
 * A long description folded to its first screenful with a "show all" button. The whole text is
 * always in the page (for search engines and find-in-page); folding only clips it.
 */
const ExpandableText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const t = useTranslations("products.detail");
  const [open, setOpen] = useState(false);
  const id = useId();
  const foldable = text.length > FOLD_AT;
  const folded = foldable && !open;

  return (
    <div className={className}>
      <div
        id={id}
        className={cn(
          "text-muted-foreground relative leading-relaxed whitespace-pre-line",
          folded && "max-h-[22rem] overflow-hidden",
        )}
      >
        <LinkedText text={text} />
        {folded && (
          <div
            aria-hidden
            className="from-background absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent"
          />
        )}
      </div>
      {foldable && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={id}
          className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          {open ? t("readLess") : t("readMore")}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      )}
    </div>
  );
};

export { ExpandableText };
