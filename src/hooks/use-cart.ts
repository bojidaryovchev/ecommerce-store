import { addToCart } from "@/actions/add-to-cart.action";
import { clearCart } from "@/actions/clear-cart.action";
import type { CartData } from "@/actions/get-cart.action";
import { getCart } from "@/actions/get-cart.action";
import { removeFromCart } from "@/actions/remove-from-cart.action";
import { updateCartItem } from "@/actions/update-cart-item.action";
import type { AddToCartData, RemoveFromCartData, UpdateCartItemData } from "@/schemas/cart.schema";
import useSWR from "swr";

interface UseCartOptions {
  sessionId?: string;
}

export function useCart(options?: UseCartOptions) {
  const { data, error, isLoading, mutate } = useSWR<CartData | null>(
    ["/api/cart", options?.sessionId],
    () => getCart(options?.sessionId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    },
  );

  /**
   * Add item to cart with optimistic update
   */
  const addItem = async (itemData: AddToCartData) => {
    try {
      // Optimistically update the UI
      if (data) {
        mutate(
          async () => {
            const updatedCart = await addToCart(itemData, options?.sessionId);
            return updatedCart;
          },
          {
            optimisticData: data, // Keep current data while loading
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          },
        );
      } else {
        // No cart yet, create one
        const updatedCart = await addToCart(itemData, options?.sessionId);
        mutate(updatedCart, { revalidate: false });
      }
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      throw error;
    }
  };

  /**
   * Update cart item quantity with optimistic update
   */
  const updateItem = async (itemData: UpdateCartItemData) => {
    try {
      if (!data) return;

      // Create optimistic data
      const optimisticData: CartData = {
        ...data,
        items: data.items.map((item) =>
          item.id === itemData.cartItemId ? { ...item, quantity: itemData.quantity } : item,
        ),
      };

      await mutate(
        async () => {
          const updatedCart = await updateCartItem(itemData);
          return updatedCart;
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      );
    } catch (error) {
      console.error("Failed to update cart item:", error);
      throw error;
    }
  };

  /**
   * Remove item from cart with optimistic update
   */
  const removeItem = async (itemData: RemoveFromCartData) => {
    try {
      if (!data) return;

      // Create optimistic data by filtering out the removed item
      const optimisticData: CartData = {
        ...data,
        items: data.items.filter((item) => item.id !== itemData.cartItemId),
      };

      await mutate(
        async () => {
          const updatedCart = await removeFromCart(itemData);
          return updatedCart;
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      );
    } catch (error) {
      console.error("Failed to remove cart item:", error);
      throw error;
    }
  };

  /**
   * Clear entire cart
   */
  const clear = async () => {
    try {
      if (!data) return;

      // Optimistically show empty cart
      const optimisticData: CartData = {
        ...data,
        items: [],
        summary: {
          itemCount: 0,
          subtotal: 0,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          total: 0,
        },
      };

      await mutate(
        async () => {
          const updatedCart = await clearCart(options?.sessionId);
          return updatedCart;
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      );
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  return {
    cart: data ?? null,
    isLoading,
    isError: !!error,
    error,
    itemCount: data?.summary.itemCount ?? 0,
    subtotal: data?.summary.subtotal ?? 0,
    total: data?.summary.total ?? 0,
    addItem,
    updateItem,
    removeItem,
    clear,
    mutate,
  };
}
