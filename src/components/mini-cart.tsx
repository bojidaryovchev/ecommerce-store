"use client";

import CartItem from "@/components/cart-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useCartContext } from "@/contexts/cart-context";
import { formatCartPrice } from "@/lib/cart-utils";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import type React from "react";

const MiniCart: React.FC = () => {
  const { cart, itemCount, total, isLoading } = useCartContext();

  const displayItems = cart?.items.slice(0, 3) || [];
  const hasMoreItems = (cart?.items.length || 0) > 3;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Shopping cart">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1.5 text-xs" variant="default">
              {itemCount > 99 ? "99+" : itemCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-3">
          <h3 className="font-semibold">Shopping Cart</h3>
          <p className="text-muted-foreground text-sm">
            {itemCount === 0 ? "Your cart is empty" : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          </p>
        </div>

        {isLoading && (
          <div className="px-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">Loading cart...</p>
          </div>
        )}

        {!isLoading && itemCount === 0 && (
          <div className="px-4 py-8 text-center">
            <ShoppingCart className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
            <p className="text-muted-foreground text-sm">Start adding items to your cart</p>
          </div>
        )}

        {!isLoading && itemCount > 0 && (
          <>
            <Separator />
            <div className="max-h-[300px] overflow-y-auto">
              {displayItems.map((item) => (
                <div key={item.id} className="px-4">
                  <CartItem item={item} compact />
                </div>
              ))}
              {hasMoreItems && (
                <div className="px-4 py-2">
                  <p className="text-muted-foreground text-center text-sm">
                    +{(cart?.items.length || 0) - 3} more {(cart?.items.length || 0) - 3 === 1 ? "item" : "items"}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold">{formatCartPrice(total)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <DropdownMenuItem asChild>
                  <Link href="/cart" className="w-full">
                    <Button variant="outline" className="w-full">
                      View Cart
                    </Button>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full">Checkout</Button>
                  </Link>
                </DropdownMenuItem>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MiniCart;
