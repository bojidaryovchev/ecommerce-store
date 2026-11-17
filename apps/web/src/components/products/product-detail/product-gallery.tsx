"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useCallback, useState } from "react";

interface Props {
  images: string[];
  name: string;
}

/** Main photo with thumbnails; clicking opens a large view where a click/tap zooms in at that point. */
const ProductGallery: React.FC<Props> = ({ images, name }) => {
  const t = useTranslations("products.detail.gallery");
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const count = images.length;
  const go = useCallback(
    (delta: number) => {
      setZoom(null);
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  if (count === 0) {
    return (
      <div className="bg-muted flex aspect-square items-center justify-center rounded-lg">
        <span className="text-muted-foreground text-8xl">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  const current = images[index] ?? images[0]!;

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="group relative block aspect-square w-full overflow-hidden rounded-lg border bg-white"
        onClick={() => setOpen(true)}
        aria-label={t("zoom")}
      >
        <Image
          src={current}
          alt={t("alt", { name, number: index + 1 })}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-4"
          priority={index === 0}
        />
        <span className="bg-background/80 absolute right-3 bottom-3 rounded-full p-2 opacity-70 shadow transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="list">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              role="listitem"
              onClick={() => setIndex(i)}
              aria-label={t("show", { number: i + 1 })}
              aria-current={i === index}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-white",
                i === index ? "ring-primary ring-2" : "opacity-80 hover:opacity-100",
              )}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setZoom(null);
        }}
      >
        <DialogContent
          className="max-w-[min(96vw,64rem)] gap-2 p-2 sm:p-4"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
          }}
        >
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div
            className={cn(
              "relative h-[75vh] w-full overflow-hidden bg-white",
              zoom ? "cursor-zoom-out" : "cursor-zoom-in",
            )}
            onClick={(event) => {
              if (zoom) {
                setZoom(null);
                return;
              }
              const rect = event.currentTarget.getBoundingClientRect();
              setZoom({
                x: ((event.clientX - rect.left) / rect.width) * 100,
                y: ((event.clientY - rect.top) / rect.height) * 100,
              });
            }}
          >
            <Image
              src={current}
              alt={t("alt", { name, number: index + 1 })}
              fill
              sizes="96vw"
              className="object-contain transition-transform duration-200"
              style={zoom ? { transform: "scale(2.5)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </div>
          {count > 1 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="hover:bg-accent rounded-full p-2"
                onClick={() => go(-1)}
                aria-label={t("previous")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-muted-foreground text-sm" aria-live="polite">
                {t("position", { current: index + 1, total: count })}
              </span>
              <button
                type="button"
                className="hover:bg-accent rounded-full p-2"
                onClick={() => go(1)}
                aria-label={t("next")}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { ProductGallery };
