import { CartSheet } from "@/components/cart";
import { CartProvider } from "@/contexts/cart-context";
import { auth } from "@/lib/auth";
import { getCartBySessionId, getCartByUserId } from "@/queries/cart";
import type { CartWithItems } from "@/types/cart.type";
import { cookies } from "next/headers";
import React, { PropsWithChildren } from "react";

const CART_SESSION_COOKIE = "cart_session_id";

const CartProviders: React.FC<PropsWithChildren> = async ({ children }) => {
  const session = await auth();
  let initialCart: CartWithItems | null = null;

  if (session?.user?.id) {
    initialCart = (await getCartByUserId(session.user.id)) ?? null;
  } else {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
    if (sessionId) {
      initialCart = (await getCartBySessionId(sessionId)) ?? null;
    }
  }

  return (
    <CartProvider initialCart={initialCart}>
      {children}
      <CartSheet />
    </CartProvider>
  );
};

export default CartProviders;
