"use client";

import { AddressDisplay, OrderStatusBadge, OrderSummary } from "@/components/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDisclosure } from "@/hooks/use-disclosure";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateOrderStatus } from "@/mutations/orders";
import type { OrderWithItemsAndUser } from "@/queries/orders";
import type { OrderStatus } from "@ecommerce/database/schema";
import { ArrowLeft, CheckCircle, Package, RotateCcw, Truck, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

type Props = {
  order: OrderWithItemsAndUser;
};

/**
 * Allowed status transitions from each status
 */
const STATUS_TRANSITIONS: Record<
  OrderStatus,
  { status: OrderStatus; label: string; icon: React.ReactNode; variant: "default" | "destructive" | "outline" }[]
> = {
  pending: [
    { status: "cancelled", label: "Cancel Order", icon: <XCircle className="mr-1 h-4 w-4" />, variant: "destructive" },
  ],
  paid: [
    { status: "processing", label: "Start Processing", icon: <Package className="mr-1 h-4 w-4" />, variant: "default" },
    { status: "cancelled", label: "Cancel Order", icon: <XCircle className="mr-1 h-4 w-4" />, variant: "destructive" },
  ],
  processing: [
    { status: "shipped", label: "Mark Shipped", icon: <Truck className="mr-1 h-4 w-4" />, variant: "default" },
    { status: "cancelled", label: "Cancel Order", icon: <XCircle className="mr-1 h-4 w-4" />, variant: "destructive" },
  ],
  shipped: [
    {
      status: "delivered",
      label: "Mark Delivered",
      icon: <CheckCircle className="mr-1 h-4 w-4" />,
      variant: "default",
    },
  ],
  delivered: [
    { status: "refunded", label: "Refund Order", icon: <RotateCcw className="mr-1 h-4 w-4" />, variant: "destructive" },
  ],
  cancelled: [],
  refunded: [],
};

const AdminOrderDetail: React.FC<Props> = ({ order }) => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [targetStatus, setTargetStatus] = useState<{ status: OrderStatus; label: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const transitions = STATUS_TRANSITIONS[order.status];

  const handleStatusClick = (status: OrderStatus, label: string) => {
    setTargetStatus({ status, label });
    onOpen();
  };

  const handleConfirmUpdate = async () => {
    if (!targetStatus) return;
    setIsUpdating(true);
    try {
      const result = await updateOrderStatus(order.id, targetStatus.status);
      if (result.success) {
        toast.success(`Order status updated to ${targetStatus.status}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
      onClose();
      setTargetStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {transitions.length > 0 && (
            <div className="flex gap-2">
              {transitions.map((t) => (
                <Button
                  key={t.status}
                  variant={t.variant}
                  size="sm"
                  onClick={() => handleStatusClick(t.status, t.label)}
                >
                  {t.icon}
                  {t.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {order.user ? (
              <div className="space-y-1">
                <p className="font-medium">{order.user.name ?? "—"}</p>
                <p className="text-muted-foreground">{order.user.email}</p>
              </div>
            ) : order.guestEmail ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase">Guest checkout</p>
                <p>{order.guestEmail}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No customer info</p>
            )}
          </div>
        </CardContent>
      </Card>

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
                            <Link href={`/admin/products/${item.product.id}`} className="hover:underline">
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

        {/* Sidebar */}
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

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ordered</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>{formatDate(order.paidAt)}</span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipped</span>
                    <span>{formatDate(order.shippedAt)}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivered</span>
                    <span>{formatDate(order.deliveredAt)}</span>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled</span>
                    <span>{formatDate(order.cancelledAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes / Metadata */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.stripePaymentIntentId && (
            <Card>
              <CardHeader>
                <CardTitle>Stripe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Intent</span>
                    <span className="font-mono text-xs">{order.stripePaymentIntentId.slice(0, 20)}…</span>
                  </div>
                  {order.stripeCheckoutSessionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session</span>
                      <span className="font-mono text-xs">{order.stripeCheckoutSessionId.slice(0, 20)}…</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Status Update Confirmation Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to update order #{order.id.slice(0, 8).toUpperCase()} status to{" "}
              <strong>{targetStatus?.status}</strong>?
              {targetStatus?.status === "cancelled" && " This action cannot be easily undone."}
              {targetStatus?.status === "refunded" && " This will mark the order as refunded."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              variant={
                targetStatus?.status === "cancelled" || targetStatus?.status === "refunded" ? "destructive" : "default"
              }
              onClick={handleConfirmUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { AdminOrderDetail };
