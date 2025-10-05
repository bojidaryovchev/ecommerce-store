"use client";

import { getOrderDetails } from "@/actions/get-order-details.action";
import type { Order } from "@/actions/get-orders.action";
import OrderDetailsModal from "@/components/order-details-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatOrderTotal, getOrderStatusInfo, getPaymentStatusInfo } from "@/lib/order-utils";
import { Calendar, Package, ShoppingCart, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface OrdersListProps {
  orders: Order[];
}

const OrdersList: React.FC<OrdersListProps> = ({ orders }) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Awaited<ReturnType<typeof getOrderDetails>> | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleOrderClick = async (order: Order) => {
    setLoading(true);
    setSelectedOrderId(order.id);
    try {
      const details = await getOrderDetails(order.id);
      if (details) {
        setOrderDetails(details);
        setDetailsModalOpen(true);
      } else {
        toast.error("Order not found");
      }
    } catch (error) {
      toast.error("Failed to load order details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <ShoppingCart className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">No orders yet</h3>
        <p className="text-muted-foreground text-sm">Orders will appear here once customers start purchasing</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const orderStatus = getOrderStatusInfo(order.status);
          const paymentStatus = getPaymentStatusInfo(order.paymentStatus);
          const customerName = order.user?.name || order.customerName || "Guest";
          const customerEmail = order.user?.email || order.customerEmail || "N/A";

          return (
            <Card
              key={order.id}
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => handleOrderClick(order)}
              style={{ opacity: loading && selectedOrderId === order.id ? 0.6 : 1 }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Section - Order Info */}
                  <div className="flex-1 space-y-3">
                    {/* Order Number & Date */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">{customerName}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{customerEmail}</span>
                    </div>

                    {/* Items Count */}
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      <span>
                        {order._count.items} {order._count.items === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>

                  {/* Right Section - Status & Total */}
                  <div className="flex flex-col gap-3 lg:items-end">
                    {/* Order Total */}
                    <div className="text-2xl font-bold">{formatOrderTotal(Number(order.total))}</div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={orderStatus.color}>{orderStatus.label}</Badge>
                      <Badge className={paymentStatus.color}>{paymentStatus.label}</Badge>
                    </div>

                    {/* Shipping Address Preview */}
                    {order.shippingAddress && (
                      <div className="text-muted-foreground text-xs lg:text-right">
                        {order.shippingAddress.city}, {order.shippingAddress.state || order.shippingAddress.country}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {orderDetails && (
        <OrderDetailsModal
          order={orderDetails}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onOrderUpdated={async () => {
            // Refresh the order details
            const updated = await getOrderDetails(orderDetails.id);
            if (updated) {
              setOrderDetails(updated);
            }
          }}
        />
      )}
    </>
  );
};

export default OrdersList;
