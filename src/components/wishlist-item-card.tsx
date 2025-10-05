"use client";

import { removeFromWishlist } from "@/actions/remove-from-wishlist.action";
import AddToCartButton from "@/components/add-to-cart-button";
import ConfirmDialog from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/product-utils";
import type { Product } from "@prisma/client";
import { Heart, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

interface WishlistItemCardProps {
  productId: string;
  product: Product & {
    images: { url: string; alt: string | null }[];
  };
  onRemove?: () => void;
}

export function WishlistItemCard({ productId, product, onRemove }: WishlistItemCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const result = await removeFromWishlist({ productId });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Removed from wishlist");
        onRemove?.();
      }
    } catch {
      toast.error("Failed to remove item. Please try again.");
    } finally {
      setIsRemoving(false);
      setShowRemoveDialog(false);
    }
  };

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 5;
  const discount = product.compareAtPrice
    ? Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)
    : 0;

  return (
    <>
      <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/80 absolute top-2 right-2 z-10 h-8 w-8 rounded-full backdrop-blur-sm"
          onClick={() => setShowRemoveDialog(true)}
          disabled={isRemoving}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Product Image */}
        <Link href={`/products/${product.slug}`}>
          <div className="bg-muted relative aspect-square overflow-hidden">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingCart className="text-muted-foreground h-12 w-12" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {!product.isActive && <Badge variant="destructive">Unavailable</Badge>}
              {product.isActive && isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
              {product.isActive && isLowStock && <Badge variant="secondary">Low Stock</Badge>}
              {discount > 0 && <Badge className="bg-green-600">{discount}% OFF</Badge>}
            </div>
          </div>
        </Link>

        <CardContent className="p-4">
          <Link href={`/products/${product.slug}`}>
            <h3 className="hover:text-primary line-clamp-2 font-semibold transition-colors">{product.name}</h3>
          </Link>

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold">{formatPrice(Number(product.price))}</span>
            {product.compareAtPrice && (
              <span className="text-muted-foreground text-sm line-through">
                {formatPrice(Number(product.compareAtPrice))}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.isActive && (
            <p className={`mt-1 text-sm ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
              {isOutOfStock ? "Out of stock" : isLowStock ? `Only ${product.stockQuantity} left` : "In stock"}
            </p>
          )}
        </CardContent>

        <CardFooter className="bg-muted/30 flex gap-2 border-t p-3">
          {/* Add to Cart Button */}
          {product.isActive && !isOutOfStock ? (
            <AddToCartButton productId={product.id} className="flex-1" />
          ) : (
            <Button disabled className="flex-1">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Unavailable
            </Button>
          )}

          {/* Remove from Wishlist Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowRemoveDialog(true)}
            disabled={isRemoving}
            aria-label="Remove from wishlist"
          >
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          </Button>
        </CardFooter>
      </Card>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        onConfirm={handleRemove}
        title="Remove from Wishlist"
        description="Are you sure you want to remove this item from your wishlist?"
        confirmText="Remove"
      />
    </>
  );
}
