"use client";

import { getWishlist } from "@/actions/get-wishlist.action";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WishlistItemCard } from "@/components/wishlist-item-card";
import { calculateWishlistStats, filterWishlistItems, sortWishlistItems } from "@/lib/wishlist-utils";
import type { Product } from "@prisma/client";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  product: Product & {
    images: { url: string; alt: string | null }[];
  };
};

type SortOption = "newest" | "oldest" | "name" | "price-asc" | "price-desc";

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterInStock, setFilterInStock] = useState(false);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const result = await getWishlist();
      if (result.error) {
        toast.error(result.error);
      } else {
        setWishlistItems(result.wishlistItems || []);
      }
    } catch {
      toast.error("Failed to load wishlist.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Apply filters and sorting
  const filteredItems = filterWishlistItems(wishlistItems, {
    inStock: filterInStock,
  });

  const sortedItems = sortWishlistItems(filteredItems, sortBy);

  const stats = calculateWishlistStats(wishlistItems);

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex items-center justify-center py-12">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Wishlist</h1>
        {stats.totalItems > 0 && (
          <p className="text-muted-foreground">
            {stats.totalItems} {stats.totalItems === 1 ? "item" : "items"} saved
            {stats.outOfStockItems > 0 && ` (${stats.outOfStockItems} out of stock)`}
          </p>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16">
          <Heart className="text-muted-foreground mb-4 h-16 w-16" />
          <h2 className="mb-2 text-2xl font-semibold">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Save items you love for later. Start exploring and add products to your wishlist!
          </p>
          <Button asChild>
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Button
                variant={filterInStock ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterInStock(!filterInStock)}
              >
                In Stock Only ({stats.inStockItems})
              </Button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Sort by:</span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          {sortedItems.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-muted-foreground">No items match your filters</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedItems.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  productId={item.productId}
                  product={item.product}
                  onRemove={fetchWishlist}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
