"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useState } from "react";

/**
 * The manufacturer's spec tables and diagrams, apart from the photos: small thumbnails that open full size.
 * Their figures are in the specifications table; these are for whoever wants the source.
 */
const ProductDrawings: React.FC<{ images: string[]; name: string }> = ({ images, name }) => {
  const t = useTranslations("products.detail.drawings");
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;
  const current = open === null ? null : images[open];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("lead")}</p>
      </div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((url, index) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={t("open", { number: index + 1 })}
              className="hover:border-primary/40 focus-visible:ring-ring relative block aspect-[4/3] w-full overflow-hidden rounded-xl border bg-white transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Image src={url} alt="" fill sizes="(min-width: 640px) 160px, 33vw" className="object-contain p-2" />
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-w-[min(64rem,calc(100vw-2rem))] p-2 sm:p-4">
          <DialogTitle className="sr-only">{t("title")}</DialogTitle>
          {current && (
            <div className="relative h-[75vh] w-full bg-white">
              <Image
                src={current}
                alt={t("alt", { name, number: (open ?? 0) + 1 })}
                fill
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export { ProductDrawings };
