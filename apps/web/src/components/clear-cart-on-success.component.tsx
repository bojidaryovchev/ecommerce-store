"use client";

import { useCart } from "@/contexts/cart-context";
import { useEffect } from "react";

/**
 * Component that clears the client-side cart state after a successful checkout.
 * Include this on the checkout success page to sync client state with server.
 */
export const ClearCartOnSuccess: React.FC = () => {
  const { refreshCart } = useCart();

  useEffect(() => {
    // Refresh cart from server - it will return empty since webhook cleared it
    refreshCart();
  }, [refreshCart]);

  return null;
};
