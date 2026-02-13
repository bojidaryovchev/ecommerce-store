"use client";

import { calculateCartSummary } from "@/lib/cart-utils";
import { addToCart, clearCart, getCart, removeFromCart, updateCartItemQuantity } from "@/mutations/cart";
import type { CartSummary, CartWithItems } from "@/types/cart.type";
import React, { createContext, PropsWithChildren, useCallback, useContext, useState, useTransition } from "react";
import toast from "react-hot-toast";

type CartContextType = {
  cart: CartWithItems | null;
  summary: CartSummary;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, priceId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface Props {
  initialCart: CartWithItems | null;
}

export const CartProvider: React.FC<PropsWithChildren<Props>> = ({ initialCart, children }) => {
  const [cart, setCart] = useState<CartWithItems | null>(initialCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const summary = calculateCartSummary(cart);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const refreshCart = useCallback(async () => {
    const result = await getCart();
    if (result.success) {
      setCart(result.data);
    }
  }, []);

  const addItem = useCallback(
    async (productId: string, priceId: string, quantity: number = 1) => {
      startTransition(async () => {
        const result = await addToCart(productId, priceId, quantity);

        if (result.success) {
          setCart(result.data);
          toast.success("Added to cart");
          openCart();
        } else {
          toast.error(result.error);
        }
      });
    },
    [openCart],
  );

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    startTransition(async () => {
      const result = await updateCartItemQuantity(cartItemId, quantity);

      if (result.success) {
        setCart(result.data);
      } else {
        toast.error(result.error);
      }
    });
  }, []);

  const removeItem = useCallback(async (cartItemId: string) => {
    startTransition(async () => {
      const result = await removeFromCart(cartItemId);

      if (result.success) {
        setCart(result.data);
        toast.success("Removed from cart");
      } else {
        toast.error(result.error);
      }
    });
  }, []);

  const clear = useCallback(async () => {
    startTransition(async () => {
      const result = await clearCart();

      if (result.success) {
        setCart((prev) => (prev ? { ...prev, items: [] } : null));
        toast.success("Cart cleared");
      } else {
        toast.error(result.error);
      }
    });
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        summary,
        isLoading: isPending,
        isOpen,
        openCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
        clear,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
