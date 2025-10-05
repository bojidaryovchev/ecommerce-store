"use client";

import { getOrderDetails } from "@/actions/get-order-details.action";
import OrderDetailsModal from "@/components/order-details-modal";
import OrderPagination from "@/components/order-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";
import { formatOrderTotal, getOrderStatusInfo, getPaymentStatusInfo } from "@/lib/order-utils";
import type { OrderFilterData } from "@/schemas/order.schema";
import { Calendar, Loader2, Package, ShoppingCart, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface OrdersListProps {
  searchQuery?: string;
  filters?: Partial<OrderFilterData>;
  onFiltersChange?: (filters: Partial<OrderFilterData>) => void;
}

const OrdersList: React.FC<OrdersListProps> = ({
  searchQuery = "",
  filters: externalFilters = {},
  onFiltersChange,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Awaited<ReturnType<typeof getOrderDetails>> | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [clickLoading, setClickLoading] = useState<boolean>(false);

  // Merge search query with external filters
  const isEmail = searchQuery.includes("@");
  const searchFilters = searchQuery
    ? {
        ...(isEmail ? { customerEmail: searchQuery } : { orderNumber: searchQuery }),
      }
    : {};

  const mergedFilters = {
    ...externalFilters,
    ...searchFilters,
  };

  const { orders, pagination, isLoading, mutate } = useOrders({ filters: mergedFilters });

  const handlePageChange = (page: number) => {
    if (onFiltersChange) {
      onFiltersChange({ ...externalFilters, page });
    }
  };

  const handlePageSizeChange = (limit: number) => {
    if (onFiltersChange) {
      onFiltersChange({ ...externalFilters, page: 1, limit });
    }
  };

  const handleOrderClick = async (orderId: string) => {
    setClickLoading(true);
    setSelectedOrderId(orderId);
    try {
      const details = await getOrderDetails(orderId);
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
      setClickLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Empty state
  if (!orders || orders.length === 0) {
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
              onClick={() => handleOrderClick(order.id)}
              style={{ opacity: clickLoading && selectedOrderId === order.id ? 0.6 : 1 }}
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

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <OrderPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Order Details Modal */}
      {orderDetails && (
        <OrderDetailsModal
          order={orderDetails}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onOrderUpdated={async () => {
            // Refresh the order details and the list
            const updated = await getOrderDetails(orderDetails.id);
            if (updated) {
              setOrderDetails(updated);
            }
            mutate();
          }}
        />
      )}
    </>
  );
};

export default OrdersList;
