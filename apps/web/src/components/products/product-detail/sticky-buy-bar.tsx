"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { AddToCartButton } from "./product-add-to-cart/add-to-cart-button";

interface Props {
  /** The element whose scrolling out of view brings the bar in: the page's own buy button. */
  targetId: string;
  name: string;
  price: string;
  productId: string;
  priceId: string;
}

/**
 * On phones, once the buy button has scrolled away above the screen, a bar at the bottom keeps the
 * price and the button in reach. Hidden on large screens, where the buy box stays in view.
 */
const StickyBuyBar: React.FC<Props> = ({ targetId, name, price, productId, priceId }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Only once it is above the screen: not while the visitor has not reached it yet.
      if (entry) setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        "bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.2)] backdrop-blur transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs">{name}</p>
          <p className="text-primary text-lg font-bold">{price}</p>
        </div>
        <AddToCartButton productId={productId} priceId={priceId} size="default" className="w-auto shrink-0 px-5" />
      </div>
    </div>
  );
};

export { StickyBuyBar };
