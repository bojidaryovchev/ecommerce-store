import { WishlistButton } from "@/components/products/wishlist-button";
import { auth } from "@/lib/auth";
import { isProductWishlisted } from "@/queries/wishlist";
import React from "react";

/**
 * The wishlist heart for a signed-in visitor. It reads the session, so it renders per request in its
 * own Suspense island and the rest of the product page stays prerendered.
 */
const ProductWishlist: React.FC<{ productId: string }> = async ({ productId }) => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const wishlisted = await isProductWishlisted(session.user.id, productId);
  return <WishlistButton productId={productId} isWishlisted={wishlisted} variant="labeled" />;
};

export { ProductWishlist };
