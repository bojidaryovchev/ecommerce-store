"use client";

import type { CartData } from "@/actions/get-cart.action";
import { useCart } from "@/hooks/use-cart";
import { useCartMerge } from "@/hooks/use-cart-merge";
import { getSessionId } from "@/lib/session";
import type { AddToCartData, RemoveFromCartData, UpdateCartItemData } from "@/schemas/cart.schema";
import React, { createContext, useContext } from "react";

interface CartContextValue {
  cart: CartData | null;
  isLoading: boolean;
  isError: boolean;
  itemCount: number;
  subtotal: number;
  total: number;
  sessionId: string | undefined;
  addItem: (data: AddToCartData) => Promise<void>;
  updateItem: (data: UpdateCartItemData) => Promise<void>;
  removeItem: (data: RemoveFromCartData) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

/**
 * Cart Provider Component
 * Manages global cart state and provides cart operations throughout the app
 */
export function CartProvider({ children }: CartProviderProps) {
  const sessionId = getSessionId();

  const { cart, isLoading, isError, itemCount, subtotal, total, addItem, updateItem, removeItem, clear, mutate } =
    useCart({
      sessionId,
    });

  // Handle cart merge when user logs in
  useCartMerge({
    onMergeComplete: () => {
      // Refresh cart data after merge
      mutate();
    },
  });

  const value: CartContextValue = {
    cart,
    isLoading,
    isError,
    itemCount,
    subtotal,
    total,
    sessionId,
    addItem,
    updateItem,
    removeItem,
    clearCart: clear,
    refreshCart: mutate,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to access cart context
 * Must be used within CartProvider
 */
export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
