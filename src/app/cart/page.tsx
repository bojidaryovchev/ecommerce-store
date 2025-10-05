"use client";

import CartItem from "@/components/cart-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartContext } from "@/contexts/cart-context";
import { formatCartPrice } from "@/lib/cart-utils";
import { ArrowLeft, Loader2, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";
import type React from "react";

const CartPage: React.FC = () => {
  const { cart, isLoading, itemCount, subtotal, total } = useCartContext();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading cart...</span>
        </div>
      </div>
    );
  }

  if (!cart || itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <ShoppingCart className="text-muted-foreground mx-auto mb-4 h-24 w-24" />
          <h1 className="mb-2 text-3xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven&apos;t added anything to your cart yet. Start shopping to fill it up!
          </p>
          <Link href="/products">
            <Button size="lg">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const shippingAmount = cart.summary.shippingAmount;
  const taxAmount = cart.summary.taxAmount;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <p className="text-muted-foreground mt-2">
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cart.items.map((item) => (
                <div key={item.id} className="px-6">
                  <CartItem item={item} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCartPrice(subtotal)}</span>
              </div>

              {/* Shipping */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">
                  {shippingAmount === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatCartPrice(shippingAmount)
                  )}
                </span>
              </div>

              {/* Free shipping notice */}
              {subtotal < 100 && subtotal > 0 && (
                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  Add {formatCartPrice(100 - subtotal)} more to get FREE shipping!
                </div>
              )}

              {/* Tax */}
              {taxAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-semibold">{formatCartPrice(taxAmount)}</span>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold">{formatCartPrice(total)}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Link href="/checkout" className="block w-full">
                  <Button size="lg" className="w-full">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link href="/products" className="block w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Security Notice */}
              <div className="text-muted-foreground rounded-md bg-gray-50 p-3 text-xs">
                <p>🔒 Secure Checkout</p>
                <p className="mt-1">Your payment information is processed securely.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
