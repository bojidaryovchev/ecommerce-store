import { AddressDisplay } from "@/components/orders/address-display";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderSummary } from "@/components/orders/order-summary";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderStatusHistoryEntry, OrderWithItems } from "@/queries/orders";
import { ArrowLeft, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
  order: OrderWithItems & { statusHistory?: OrderStatusHistoryEntry[] };
};

const OrderDetail: React.FC<Props> = ({ order }) => {
  const statusHistory = order.statusHistory ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/account/orders">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items
            </CardTitle>
            <CardDescription>
              {order.items.length} {order.items.length === 1 ? "item" : "items"} in this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-border divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  {item.productSnapshot.images?.[0] && (
                    <Image
                      src={item.productSnapshot.images[0]}
                      alt={item.productSnapshot.name}
                      width={64}
                      height={64}
                      className="bg-muted h-16 w-16 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {item.product ? (
                            <Link href={`/products/${item.product.id}`} className="hover:underline">
                              {item.productSnapshot.name}
                            </Link>
                          ) : (
                            item.productSnapshot.name
                          )}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Qty: {item.quantity} ×{" "}
                          {formatCurrency(item.priceSnapshot.unitAmount, item.priceSnapshot.currency)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.totalAmount, item.priceSnapshot.currency)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary + Addresses */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderSummary
                subtotalAmount={order.subtotalAmount}
                shippingAmount={order.shippingAmount}
                taxAmount={order.taxAmount}
                discountAmount={order.discountAmount}
                totalAmount={order.totalAmount}
                currency={order.currency}
              />
            </CardContent>
          </Card>

          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressDisplay address={order.shippingAddress} />
              </CardContent>
            </Card>
          )}

          {order.billingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressDisplay address={order.billingAddress} />
              </CardContent>
            </Card>
          )}

          <OrderTimeline
            statusHistory={statusHistory}
            timestamps={{
              createdAt: order.createdAt,
              paidAt: order.paidAt,
              shippedAt: order.shippedAt,
              deliveredAt: order.deliveredAt,
              cancelledAt: order.cancelledAt,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export { OrderDetail };
