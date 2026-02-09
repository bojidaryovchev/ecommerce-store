import { ClearCartOnSuccess } from "@/components/clear-cart-on-success.component";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrderByCheckoutSessionId } from "@/lib/queries/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "Order Confirmed | Ecommerce Store",
  description: "Your order has been placed successfully",
};

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

const CheckoutSuccessPage: React.FC<Props> = async ({ searchParams }) => {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/");
  }

  const order = await getOrderByCheckoutSessionId(session_id);

  if (!order) {
    // Order might not be created yet (webhook processing)
    return (
      <main className="container mx-auto px-4 py-16">
        <ClearCartOnSuccess />
        <div className="mx-auto max-w-lg text-center">
          <CheckCircle2 className="text-primary mx-auto h-16 w-16" />
          <h1 className="mt-6 text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground mt-2">
            Your order is being processed. You will receive a confirmation email shortly.
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-16">
      <ClearCartOnSuccess />
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <CheckCircle2 className="text-primary mx-auto h-16 w-16" />
          <h1 className="mt-6 text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
            <CardDescription>
              Order #{order.id.slice(0, 8).toUpperCase()} • {formatDate(order.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">Items</h3>
              <div className="divide-border divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-3">
                    <div>
                      <p className="font-medium">{item.productSnapshot.name}</p>
                      <p className="text-muted-foreground text-sm">
                        Qty: {item.quantity} ×{" "}
                        {formatCurrency(item.priceSnapshot.unitAmount, item.priceSnapshot.currency)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.totalAmount, item.priceSnapshot.currency)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotalAmount, order.currency)}</span>
              </div>
              {order.shippingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shippingAmount, order.currency)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.taxAmount, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount, order.currency)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Shipping Address</h3>
                  <address className="text-muted-foreground text-sm not-italic">
                    {order.shippingAddress.name}
                    <br />
                    {order.shippingAddress.line1}
                    <br />
                    {order.shippingAddress.line2 && (
                      <>
                        {order.shippingAddress.line2}
                        <br />
                      </>
                    )}
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    <br />
                    {order.shippingAddress.country}
                  </address>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutSuccessPage;
