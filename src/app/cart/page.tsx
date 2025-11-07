import { prismaGetCart } from "@/actions/prisma-get-cart.action";
import { prismaMergeGuestCart } from "@/actions/prisma-merge-guest-cart.action";
import CartClient from "@/components/cart-client.component";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import Link from "next/link";
import React from "react";

const CartPage: React.FC = async () => {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session_id")?.value;

  // If user is logged in and has a guest cart, merge them
  if (session?.user?.id && sessionId) {
    await prismaMergeGuestCart({
      userId: session.user.id,
      sessionId,
    });
    // Clear the guest cart cookie after merging
    cookieStore.delete("cart_session_id");
  }

  // Get cart by userId (if logged in) or sessionId (if guest)
  const userId = session?.user?.id;

  if (!userId && !sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <p className="mb-4 text-gray-600">Your cart is empty</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const result = await prismaGetCart({ userId, sessionId });

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <p className="mb-4 text-red-600">Failed to load cart</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <p className="mb-4 text-gray-600">Your cart is empty</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Your Cart</h1>
      <CartClient cart={result.data} />
    </div>
  );
};

export default CartPage;
