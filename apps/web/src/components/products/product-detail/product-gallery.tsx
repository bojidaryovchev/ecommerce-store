"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useRef, useState } from "react";

interface Props {
  images: string[];
  name: string;
}

/** A horizontal drag longer than this is a swipe, not a tap. */
const SWIPE_PX = 40;
const ZOOM = 2.5;

const arrow =
  "bg-background/90 text-foreground absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full shadow-md ring-1 ring-black/5 transition-opacity hover:bg-background focus-visible:opacity-100";

/**
 * The product's photos: a large view with arrows, swipe and a counter, thumbnails below, and a
 * full-screen view where a click or tap zooms in at that point and moving the pointer (or dragging)
 * looks around the zoomed photo.
 */
const ProductGallery: React.FC<Props> = ({ images, name }) => {
  const t = useTranslations("products.detail.gallery");
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const thumbs = useRef<Array<HTMLButtonElement | null>>([]);
  // Where a pointer went down, to tell a swipe from a tap; a swipe must not also open the large view.
  const press = useRef<{ x: number; y: number; swiped: boolean } | null>(null);

  const count = images.length;
  const show = (next: number) => {
    const target = (next + count) % count;
    setZoom(null);
    setIndex(target);
    thumbs.current[target]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  };

  if (count === 0) {
    return (
      <div className="bg-muted flex aspect-square items-center justify-center rounded-2xl">
        <span className="text-muted-foreground text-8xl">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  const current = images[index] ?? images[0]!;
  const alt = t("alt", { name, number: index + 1 });

  const onPointerDown = (event: React.PointerEvent) => {
    press.current = { x: event.clientX, y: event.clientY, swiped: false };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = press.current;
    if (!start || count < 2) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
      start.swiped = true;
      show(index + (dx < 0 ? 1 : -1));
    }
  };
  const swiped = () => {
    const was = press.current?.swiped ?? false;
    press.current = null;
    return was;
  };

  /** The point of the photo under the pointer, in percent, which the zoomed view centres on. */
  const pointOf = (event: React.PointerEvent | React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  return (
    <div className="min-w-0 space-y-3">
      <div className="group relative">
        <button
          type="button"
          className="relative block aspect-square w-full touch-pan-y overflow-hidden rounded-2xl border bg-white"
          onClick={() => {
            if (!swiped()) setOpen(true);
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          aria-label={t("zoom")}
        >
          <Image
            src={current}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain p-6"
            priority={index === 0}
            draggable={false}
          />
          <span className="bg-background/90 absolute right-3 bottom-3 rounded-full p-2 shadow ring-1 ring-black/5">
            <ZoomIn className="size-4" aria-hidden />
          </span>
          {count > 1 && (
            <span className="bg-background/90 absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums shadow ring-1 ring-black/5">
              {index + 1} / {count}
            </span>
          )}
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => show(index - 1)}
              aria-label={t("previous")}
              className={cn(arrow, "left-3 opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100")}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => show(index + 1)}
              aria-label={t("next")}
              className={cn(arrow, "right-3 opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100")}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="flex [scrollbar-width:thin] gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <li key={image} className="shrink-0">
              <button
                ref={(element) => {
                  thumbs.current[i] = element;
                }}
                type="button"
                onClick={() => show(i)}
                aria-label={t("show", { number: i + 1 })}
                aria-current={i === index}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-xl border bg-white transition",
                  i === index ? "ring-primary ring-2 ring-offset-1" : "opacity-75 hover:opacity-100",
                )}
              >
                <Image src={image} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setZoom(null);
        }}
      >
        <DialogContent
          className="max-w-[min(96vw,72rem)] gap-2 p-2 sm:p-4"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") show(index + 1);
            if (event.key === "ArrowLeft") show(index - 1);
          }}
        >
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div
            className={cn(
              "relative h-[78vh] w-full overflow-hidden rounded-lg bg-white select-none",
              zoom ? "cursor-zoom-out touch-none" : "cursor-zoom-in touch-pan-y",
            )}
            onPointerDown={onPointerDown}
            onPointerUp={(event) => {
              if (!zoom) onPointerUp(event);
            }}
            onPointerMove={(event) => {
              // Zoomed in, the photo follows the pointer: the mouse just moves, a finger drags.
              if (zoom && (event.pointerType === "mouse" || event.buttons === 1)) setZoom(pointOf(event));
            }}
            onClick={(event) => {
              if (swiped()) return;
              setZoom(zoom ? null : pointOf(event));
            }}
          >
            <Image
              src={current}
              alt={alt}
              fill
              sizes="96vw"
              draggable={false}
              className="object-contain transition-transform duration-150 ease-out"
              style={zoom ? { transform: `scale(${ZOOM})`, transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </div>
          {count > 1 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="hover:bg-accent rounded-full p-2"
                onClick={() => show(index - 1)}
                aria-label={t("previous")}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <span className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
                {t("position", { current: index + 1, total: count })}
              </span>
              <button
                type="button"
                className="hover:bg-accent rounded-full p-2"
                onClick={() => show(index + 1)}
                aria-label={t("next")}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          )}
          <p className="text-muted-foreground text-center text-xs">{zoom ? t("zoomOut") : t("zoomHint")}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { ProductGallery };
