"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/cart-context";
import { priceFormat } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { deliveryFee, untilFreeDelivery } from "@/lib/delivery";
import { Loader2, ShoppingBag, Truck } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { CartItem } from "./cart-item";

/** What delivery costs for this cart, or how far it is from travelling free (lib/delivery.ts). */
const DeliveryLine: React.FC<{ subtotal: number; currency: string }> = ({ subtotal, currency }) => {
  const t = useTranslations("cart.delivery");
  const format = useFormatter();
  const money = (cents: number) => format.number(cents / 100, priceFormat(currency));
  const fee = deliveryFee(subtotal);
  const missing = untilFreeDelivery(subtotal);
  return (
    <div className="space-y-1 text-sm">
      <p
        className={
          fee === 0
            ? "flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400"
            : "flex items-center gap-2"
        }
      >
        <Truck className="size-4" aria-hidden />
        {fee === 0 ? t("free") : t("fee", { fee: money(fee) })}
      </p>
      {missing > 0 && <p className="text-muted-foreground text-xs">{t("until", { amount: money(missing) })}</p>}
    </div>
  );
};

const CartSheet: React.FC = () => {
  const { cart, summary, isOpen, closeCart, isLoading, clear } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const t = useTranslations("cart.sheet");
  const format = useFormatter();

  const locale = useLocale();
  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json<{ url?: string; error?: string }>();

      if (!response.ok) {
        throw new Error(data.error || t("checkoutFailed"));
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("checkoutFailed"));
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {t("title")}
            {summary.itemCount > 0 && (
              <span className="text-muted-foreground text-sm font-normal">
                {t("itemCount", { count: summary.itemCount })}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>{isEmpty ? t("emptyDescription") : t("description")}</SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8">
              <ShoppingBag className="text-muted-foreground h-16 w-16" />
              <p className="text-muted-foreground text-center">
                {t("emptyTitle")}
                <br />
                {t("emptyHint")}
              </p>
              <Button asChild onClick={closeCart}>
                <Link href="/products">{t("browseProducts")}</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-border divide-y px-1">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {!isEmpty && (
          <SheetFooter className="flex-col gap-4 border-t pt-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span className="text-lg font-semibold">
                {format.number(summary.subtotal / 100, priceFormat(summary.currency))}
              </span>
            </div>

            <DeliveryLine subtotal={summary.subtotal} currency={summary.currency} />
            <p className="text-muted-foreground text-xs">
              {t("shippingNote")} {t("promoHint")}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full" disabled={isLoading || isCheckingOut} onClick={handleCheckout}>
                {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("checkout")}
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={closeCart}>
                  {t("continueShopping")}
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => clear()}
                  disabled={isLoading || isCheckingOut}
                >
                  {t("clearCart")}
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export { CartSheet };
