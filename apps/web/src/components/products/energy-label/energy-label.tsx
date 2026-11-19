"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { EnergyLabelView } from "@/lib/energy-label";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import React from "react";

type Props = EnergyLabelView & {
  /** The price's text size: the rules want the class in a font size equivalent to the price's. */
  className?: string;
};

const isImage = (url: string) => /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url) || url.startsWith("/");

/** An arrow pointing left, as on the label, in the class's colour; the class in white. */
const Arrow: React.FC<{ value: string; colour: string }> = ({ value, colour }) => (
  <span
    className="inline-flex items-center py-0.5 pr-2 pl-[0.7em] leading-none font-bold text-white"
    style={{
      backgroundColor: colour,
      clipPath: "polygon(0.45em 0, 100% 0, 100% 100%, 0.45em 100%, 0 50%)",
      // White as the rules want, with a faint edge so it stays legible on the yellow classes.
      textShadow: "0 0 1px rgb(0 0 0 / 0.6), 0 0 2px rgb(0 0 0 / 0.35)",
    }}
  >
    {value}
  </span>
);

/**
 * The energy class next to the price (the EU internet display rules): the arrow opens the label, in a dialog with
 * a close button when the shop has its image, else in a new tab (an EPREL page or a PDF); the product fiche link
 * sits beside it. With two classes (an air conditioner's cooling and heating) there are two arrows.
 */
const EnergyLabel: React.FC<Props> = ({ arrows, label, fiche, className }) => {
  const t = useTranslations("products.detail.energyLabel");
  const arrowRow = (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      {arrows.map((arrow) => (
        <span key={`${arrow.function}-${arrow.value}`} className="inline-flex items-center gap-1">
          {arrow.function && <span className="text-muted-foreground text-xs font-medium">{t(arrow.function)}</span>}
          <Arrow value={arrow.value} colour={arrow.colour} />
        </span>
      ))}
    </span>
  );
  const name = t("open", { value: arrows.map((arrow) => arrow.value).join(" / ") });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {isImage(label) ? (
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={name}
              className="focus-visible:ring-ring relative z-10 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              {arrowRow}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(92vw,28rem)] p-4">
            <DialogTitle className="text-base">{t("title")}</DialogTitle>
            {/* The label as published, unprocessed: its figures must stay legible. */}
            <img src={label} alt={name} className="mx-auto max-h-[75vh] w-auto" />
          </DialogContent>
        </Dialog>
      ) : (
        <a
          href={label}
          target="_blank"
          rel="noopener"
          aria-label={name}
          className="focus-visible:ring-ring relative z-10 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          {arrowRow}
        </a>
      )}
      {fiche && (
        <a
          href={fiche}
          target="_blank"
          rel="noopener"
          className="text-primary relative z-10 text-sm font-medium underline-offset-2 hover:underline"
        >
          {t("fiche")}
        </a>
      )}
    </div>
  );
};

export { EnergyLabel };
