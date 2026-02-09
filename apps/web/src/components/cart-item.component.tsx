"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/utils";
import type { CartItemWithProduct } from "@/types/cart.type";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  item: CartItemWithProduct;
}

const CartItem: React.FC<Props> = ({ item }) => {
  const { updateQuantity, removeItem, isLoading } = useCart();
  const productImage = item.product.images?.[0];

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  const unitAmount = item.price.unitAmount ?? 0;
  const lineTotal = unitAmount * item.quantity;

  return (
    <div className="flex gap-4 py-4">
      {/* Product Image */}
      <Link href={`/products/${item.product.id}`} className="shrink-0">
        <div className="bg-muted h-20 w-20 overflow-hidden rounded-lg">
          {productImage ? (
            <Image
              src={productImage}
              alt={item.product.name}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-muted-foreground text-2xl">{item.product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-1">
          <Link href={`/products/${item.product.id}`}>
            <h4 className="line-clamp-1 text-sm font-medium hover:underline">{item.product.name}</h4>
          </Link>
          <p className="text-muted-foreground text-sm">{formatCurrency(unitAmount, item.price.currency)}</p>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDecrement} disabled={isLoading}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleIncrement} disabled={isLoading}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Line Total & Remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{formatCurrency(lineTotal, item.price.currency)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-8 w-8"
              onClick={handleRemove}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
