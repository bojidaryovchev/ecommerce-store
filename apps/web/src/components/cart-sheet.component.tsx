"use client";

import CartItem from "@/components/cart-item.component";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";

const CartSheet: React.FC = () => {
  const { cart, summary, isOpen, closeCart, isLoading, clear } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json<{ url?: string; error?: string }>();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
            {summary.itemCount > 0 && (
              <span className="text-muted-foreground text-sm font-normal">
                ({summary.itemCount} {summary.itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            {isEmpty ? "Your cart is empty" : "Review your items and proceed to checkout"}
          </SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8">
              <ShoppingBag className="text-muted-foreground h-16 w-16" />
              <p className="text-muted-foreground text-center">
                Your cart is empty.
                <br />
                Start shopping to add items!
              </p>
              <Button asChild onClick={closeCart}>
                <Link href="/products">Browse Products</Link>
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
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold">{formatCurrency(summary.subtotal, summary.currency)}</span>
            </div>

            <p className="text-muted-foreground text-xs">Shipping and taxes calculated at checkout.</p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full" disabled={isLoading || isCheckingOut} onClick={handleCheckout}>
                {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proceed to Checkout
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={closeCart} asChild>
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => clear()}
                  disabled={isLoading || isCheckingOut}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
