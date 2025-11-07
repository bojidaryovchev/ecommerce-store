"use client";

import { prismaClearCart } from "@/actions/prisma-clear-cart.action";
import { prismaRemoveCartItem } from "@/actions/prisma-remove-cart-item.action";
import { prismaUpdateCartItem } from "@/actions/prisma-update-cart-item.action";
import { stripeCreateCheckoutSessionFromCart } from "@/actions/stripe-create-checkout-session-from-cart.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { Cart, CartItem, Price, Product } from "@prisma/client";
import { ArrowLeftIcon, CreditCardIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";

type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
    price: Price;
  })[];
};

interface Props {
  cart: CartWithItems;
}

const CartClient: React.FC<Props> = ({ cart }) => {
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    const result = await prismaUpdateCartItem({ cartItemId, quantity });

    if (!result.success) {
      toast.error(result.error || "Failed to update quantity");
    } else {
      toast.success("Quantity updated");
      router.refresh();
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    const result = await prismaRemoveCartItem(cartItemId);

    if (!result.success) {
      toast.error(result.error || "Failed to remove item");
    } else {
      toast.success("Item removed");
      router.refresh();
    }
  };

  const handleClearCart = async () => {
    const result = await prismaClearCart(cart.id);

    if (!result.success) {
      toast.error(result.error || "Failed to clear cart");
    } else {
      toast.success("Cart cleared");
      router.refresh();
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      const result = await stripeCreateCheckoutSessionFromCart({
        cartId: cart.id,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create checkout session");
      } else {
        window.location.href = result.data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotal = cart.items.reduce((total, item) => total + item.price.unitAmount * item.quantity, 0);

  if (cart.items.length === 0) {
    return (
      <div className="py-12 text-center">
        <ShoppingBagIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="mb-4 text-gray-600">Your cart is empty</p>
        <Link href="/products">
          <Button>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
        <Button variant="outline" onClick={handleClearCart}>
          <Trash2Icon className="mr-2 h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <div className="space-y-4">
        {cart.items.map((item) => {
          const imageUrl = item.product.images[0];

          return (
            <div key={item.id} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <Link
                href={`/products/${item.product.id}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-100"
              >
                {imageUrl && (
                  <Image src={imageUrl} alt={item.product.name} fill sizes="96px" className="object-cover" />
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/products/${item.product.id}`} className="font-semibold text-gray-900 hover:underline">
                    {item.product.name}
                  </Link>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatCurrency(item.price.unitAmount, item.price.currency)}
                    {item.price.type === "RECURRING" && ` / ${item.price.interval}`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  </div>

                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.price.unitAmount * item.quantity, item.price.currency)}
                  </p>

                  <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                    <Trash2Icon className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Subtotal</span>
            <span className="font-bold">{formatCurrency(subtotal, cart.items[0].price.currency)}</span>
          </div>
          <p className="text-sm text-gray-600">Taxes and shipping calculated at checkout</p>
        </div>

        <Button className="mt-4 w-full" onClick={handleCheckout} disabled={isCheckingOut}>
          <CreditCardIcon className="mr-2 h-4 w-4" />
          {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
        </Button>

        <Link href="/products" className="mt-4 block text-center">
          <Button variant="link">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CartClient;
