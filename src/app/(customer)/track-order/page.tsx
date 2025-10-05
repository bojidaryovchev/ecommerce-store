"use client";

import { getGuestOrder, type GuestOrderData } from "@/actions/get-guest-order.action";
import GiftMessageCard from "@/components/gift-message-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { Package, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<GuestOrderData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim() || !email.trim()) {
      toast.error("Please enter both order number and email");
      return;
    }

    setIsLoading(true);

    try {
      const result = await getGuestOrder({
        orderNumber: orderNumber.trim(),
        email: email.trim(),
      });

      if (result.success && result.data) {
        setOrder(result.data);
        toast.success("Order found!");
      } else {
        setOrder(null);
        toast.error(result.error || "Order not found");
      }
    } catch (error) {
      console.error("Failed to track order:", error);
      toast.error("An error occurred. Please try again.");
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Track Your Order</h1>
        <p className="text-muted-foreground">Enter your order number and email address to view your order status.</p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Order Lookup</CardTitle>
          <CardDescription>You can find your order number in the confirmation email we sent you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                placeholder="e.g., ORD-2025-ABC123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Track Order
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order {order.orderNumber}
                  </CardTitle>
                  <CardDescription>Placed on {format(new Date(order.createdAt), "PPP 'at' p")}</CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div>
                <h3 className="mb-2 font-semibold">Customer Information</h3>
                <div className="text-muted-foreground text-sm">
                  <p>{order.customerName || "Guest Customer"}</p>
                  <p>{order.customerEmail}</p>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div>
                  <h3 className="mb-2 font-semibold">Shipping Address</h3>
                  <div className="text-muted-foreground text-sm">
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gift Message */}
          {order.isGift && order.giftMessage && <GiftMessageCard message={order.giftMessage} variant="default" />}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                    {/* Product Image */}
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-lg border">
                        <Package className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline">
                          {item.productName}
                        </Link>
                        {item.variantName && <p className="text-muted-foreground text-sm">{item.variantName}</p>}
                        {item.sku && <p className="text-muted-foreground text-xs">SKU: {item.sku}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">Qty: {item.quantity}</span>
                        <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                {order.shippingAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(order.shippingAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>If you have any questions about your order, please contact our support team.</p>
              <p>
                <strong>Email:</strong> support@example.com
              </p>
              <p>
                <strong>Order Number:</strong> {order.orderNumber}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
