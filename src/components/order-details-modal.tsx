"use client";

import type { OrderDetails } from "@/actions/get-order-details.action";
import CancelOrderDialog from "@/components/cancel-order-dialog";
import OrderStatusUpdateForm from "@/components/order-status-update-form";
import RefundOrderDialog from "@/components/refund-order-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatOrderTotal, getOrderStatusInfo, getPaymentStatusInfo } from "@/lib/order-utils";
import {
  Calendar,
  CreditCard,
  Info,
  MapPin,
  Package,
  Phone,
  RefreshCcw,
  Settings,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";

interface OrderDetailsModalProps {
  order: OrderDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, open, onOpenChange, onOrderUpdated }) => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleOrderUpdate = () => {
    onOrderUpdated?.();
    onOpenChange(false);
  };
  const orderStatus = getOrderStatusInfo(order.status);
  const paymentStatus = getPaymentStatusInfo(order.paymentStatus);
  const customerName = order.user?.name || order.customerName || "Guest";
  const customerEmail = order.user?.email || order.customerEmail;

  const canCancel = order.status !== "CANCELLED" && order.status !== "REFUNDED" && order.status !== "DELIVERED";
  const canRefund = order.paymentStatus === "PAID" && order.status !== "REFUNDED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Order Details</DialogTitle>
        </DialogHeader>

        {/* Order Header Info */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">{order.orderNumber}</h3>
              <Badge className={orderStatus.color}>{orderStatus.label}</Badge>
              <Badge className={paymentStatus.color}>{paymentStatus.label}</Badge>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-sm">Total Amount</div>
            <div className="text-2xl font-bold">{formatOrderTotal(Number(order.total))}</div>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 pt-4">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span> {customerName}
                </div>
                {customerEmail && (
                  <div>
                    <span className="font-medium">Email:</span> {customerEmail}
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="h-5 w-5" />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 rounded-lg border p-4">
                      {/* Product Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.images[0].alt || item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="text-muted-foreground h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.productName}</h4>
                        {item.variantName && <p className="text-muted-foreground text-sm">{item.variantName}</p>}
                        {item.sku && <p className="text-muted-foreground text-xs">SKU: {item.sku}</p>}
                      </div>

                      {/* Quantity & Price */}
                      <div className="text-right">
                        <div className="font-medium">{formatOrderTotal(Number(item.unitPrice))}</div>
                        <div className="text-muted-foreground text-sm">Qty: {item.quantity}</div>
                        <div className="mt-1 font-semibold">{formatOrderTotal(Number(item.totalPrice))}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatOrderTotal(Number(order.subtotal))}</span>
                  </div>
                  {Number(order.taxAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({(Number(order.taxRate) * 100).toFixed(2)}%):</span>
                      <span>{formatOrderTotal(Number(order.taxAmount))}</span>
                    </div>
                  )}
                  {Number(order.shippingAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span>{formatOrderTotal(Number(order.shippingAmount))}</span>
                    </div>
                  )}
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-{formatOrderTotal(Number(order.discountAmount))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatOrderTotal(Number(order.total))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Shipping Address */}
              {order.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="font-medium">{order.shippingAddress.fullName}</div>
                    {order.shippingAddress.company && <div>{order.shippingAddress.company}</div>}
                    <div>{order.shippingAddress.address1}</div>
                    {order.shippingAddress.address2 && <div>{order.shippingAddress.address2}</div>}
                    <div>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </div>
                    <div>{order.shippingAddress.country}</div>
                    {order.shippingAddress.phone && (
                      <div className="flex items-center gap-1 pt-2">
                        <Phone className="h-3 w-3" />
                        {order.shippingAddress.phone}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Billing Address */}
              {order.billingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="font-medium">{order.billingAddress.fullName}</div>
                    {order.billingAddress.company && <div>{order.billingAddress.company}</div>}
                    <div>{order.billingAddress.address1}</div>
                    {order.billingAddress.address2 && <div>{order.billingAddress.address2}</div>}
                    <div>
                      {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                    </div>
                    <div>{order.billingAddress.country}</div>
                    {order.billingAddress.phone && (
                      <div className="flex items-center gap-1 pt-2">
                        <Phone className="h-3 w-3" />
                        {order.billingAddress.phone}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Payment & Shipping Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Shipping & Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.paymentMethod && (
                  <div>
                    <span className="font-medium">Payment Method:</span> {order.paymentMethod}
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
                  </div>
                )}
                {order.shippedAt && (
                  <div>
                    <span className="font-medium">Shipped:</span> {new Date(order.shippedAt).toLocaleString()}
                  </div>
                )}
                {order.deliveredAt && (
                  <div>
                    <span className="font-medium">Delivered:</span> {new Date(order.deliveredAt).toLocaleString()}
                  </div>
                )}
                {order.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-muted-foreground mt-1 text-sm">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status History */}
            {order.statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.statusHistory.map((history) => (
                      <div key={history.id} className="flex gap-3 text-sm">
                        <div className="text-muted-foreground whitespace-nowrap">
                          {new Date(history.createdAt).toLocaleString()}
                        </div>
                        <div>
                          {history.fromStatus && (
                            <>
                              <Badge className={getOrderStatusInfo(history.fromStatus).color} variant="outline">
                                {getOrderStatusInfo(history.fromStatus).label}
                              </Badge>
                              <span className="mx-2">→</span>
                            </>
                          )}
                          <Badge className={getOrderStatusInfo(history.toStatus).color}>
                            {getOrderStatusInfo(history.toStatus).label}
                          </Badge>
                          {history.note && <p className="text-muted-foreground mt-1">{history.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 pt-4">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Management</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusUpdateForm
                  orderId={order.id}
                  currentStatus={order.status}
                  currentTrackingNumber={order.trackingNumber}
                  onSuccess={handleOrderUpdate}
                />
              </CardContent>
            </Card>

            {/* Refund & Cancel Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Refund Button */}
                {canRefund && (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => setRefundDialogOpen(true)}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Process Refund
                    </Button>
                    <p className="text-muted-foreground text-xs">Issue a full or partial refund to the customer</p>
                  </div>
                )}

                {/* Cancel Button */}
                {canCancel && (
                  <div className="space-y-2">
                    <Button variant="destructive" className="w-full" onClick={() => setCancelDialogOpen(true)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                    <p className="text-muted-foreground text-xs">
                      Cancel this order {order.paymentStatus === "PAID" ? "and optionally issue a refund" : ""}
                    </p>
                  </div>
                )}

                {!canRefund && !canCancel && (
                  <p className="text-muted-foreground text-center text-sm">No actions available for this order</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Refund Dialog */}
      <RefundOrderDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        orderTotal={Number(order.total)}
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onSuccess={handleOrderUpdate}
      />

      {/* Cancel Dialog */}
      <CancelOrderDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStatus={order.status}
        paymentStatus={order.paymentStatus}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onSuccess={handleOrderUpdate}
      />
    </Dialog>
  );
};

export default OrderDetailsModal;
