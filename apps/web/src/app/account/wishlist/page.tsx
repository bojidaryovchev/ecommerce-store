import { ProductsGrid } from "@/components/products";
import { auth } from "@/lib/auth";
import { getWishlistByUserId, getWishlistProductIds } from "@/queries/wishlist";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "Wishlist | Ecommerce Store",
  description: "View and manage your wishlist",
};

const WishlistPage: React.FC = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [products, wishlistedProductIds] = await Promise.all([
    getWishlistByUserId(session.user.id),
    getWishlistProductIds(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Wishlist</h2>
        <p className="text-muted-foreground text-sm">
          {products.length === 0
            ? "Your wishlist is empty. Browse products and click the heart icon to save items."
            : `You have ${products.length} item${products.length === 1 ? "" : "s"} in your wishlist.`}
        </p>
      </div>

      <ProductsGrid
        products={products}
        wishlistedProductIds={wishlistedProductIds}
        variant="compact"
        emptyMessage="Your wishlist is empty. Browse products and click the heart icon to save items."
      />
    </div>
  );
};

export default WishlistPage;
