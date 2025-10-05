"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartContext } from "@/contexts/cart-context";
import type { CartItemWithRelations } from "@/lib/cart-utils";
import { formatCartPrice } from "@/lib/cart-utils";
import { Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface CartItemProps {
  item: CartItemWithRelations;
  compact?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, compact = false }) => {
  const { updateItem, removeItem } = useCartContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const price = item.variant?.price ? Number(item.variant.price) : Number(item.product.price);
  const subtotal = price * item.quantity;
  const productImage = item.product.images[0]?.url || "/placeholder-product.png";
  const productName = item.product.name;
  const variantName = item.variant?.name;

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity === item.quantity) return;
    if (newQuantity < 0 || newQuantity > 999) return;

    setIsUpdating(true);
    try {
      await updateItem({
        cartItemId: item.id,
        quantity: newQuantity,
      });

      if (newQuantity === 0) {
        toast.success("Item removed from cart");
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeItem({ cartItemId: item.id });
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item from cart");
    } finally {
      setIsRemoving(false);
    }
  };

  if (compact) {
    // Compact view for mini cart
    return (
      <div className="flex items-start gap-3 py-3">
        <Link
          href={`/products/${item.product.slug}`}
          className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md"
        >
          <Image src={productImage} alt={productName} fill className="object-cover" />
        </Link>
        <div className="flex-1 space-y-1">
          <Link href={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
            {productName}
          </Link>
          {variantName && <p className="text-muted-foreground text-xs">{variantName}</p>}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{formatCartPrice(price)}</p>
            <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  // Full view for cart page
  return (
    <div className="flex flex-col gap-4 border-b py-6 sm:flex-row">
      {/* Product Image */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md"
      >
        <Image src={productImage} alt={productName} fill className="object-cover" />
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link href={`/products/${item.product.slug}`} className="text-lg font-semibold hover:underline">
            {productName}
          </Link>
          {variantName && <p className="text-muted-foreground mt-1 text-sm">{variantName}</p>}
          <p className="mt-2 text-lg font-bold">{formatCartPrice(price)}</p>
        </div>

        {/* Quantity Controls */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              max="999"
              value={item.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  handleUpdateQuantity(value);
                }
              }}
              className="h-8 w-16 text-center"
              disabled={isUpdating}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= 999}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isRemoving} className="text-destructive">
            {isRemoving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex flex-col items-end justify-between">
        <p className="text-xl font-bold">{formatCartPrice(subtotal)}</p>
      </div>
    </div>
  );
};

export default CartItem;
