import { CartSheet } from "@/components/cart";
import { CartProvider } from "@/contexts/cart-context";
import { CART_SESSION_COOKIE } from "@/lib/cart-utils";
import { getCartBySessionId, getCartByUserId } from "@/queries/cart";
import type { CartWithItems } from "@/types/cart.type";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import React, { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  session: Session | null;
}

const CartProviders: React.FC<Props> = async ({ session, children }) => {
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
