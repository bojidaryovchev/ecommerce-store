"use client";

import { prismaUpdateOrderStatus } from "@/actions/prisma-update-order-status.action";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus, Price, Product } from "@prisma/client";
import { BanIcon, CheckCircleIcon, ClockIcon, PackageIcon, RefreshCcwIcon, XCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
    price: Price;
  })[];
};

interface Props {
  orders: OrderWithItems[];
}

const AdminOrdersListClient: React.FC<Props> = ({ orders }) => {
  const router = useRouter();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);

    const result = await prismaUpdateOrderStatus({ orderId, status });

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }

    setUpdatingOrderId(null);
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PROCESSING":
        return "secondary";
      case "FAILED":
      case "CANCELLED":
        return "destructive";
      case "REFUNDED":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "PROCESSING":
        return <PackageIcon className="h-4 w-4" />;
      case "FAILED":
        return <XCircleIcon className="h-4 w-4" />;
      case "CANCELLED":
        return <BanIcon className="h-4 w-4" />;
      case "REFUNDED":
        return <RefreshCcwIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <PackageIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="text-gray-600">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <p className="text-sm text-gray-600">Order placed</p>
                <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium text-gray-900">{order.customerEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-bold text-gray-900">{formatCurrency(order.total, order.currency)}</p>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-600">Status</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </Badge>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusUpdate(order.id, value as OrderStatus)}
                    disabled={updatingOrderId === order.id}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                      <SelectItem value="FAILED">FAILED</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {order.items.map((item) => {
                const imageUrl = item.product.images[0];

                return (
                  <div key={item.id} className="flex gap-4">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-gray-100"
                    >
                      {imageUrl && (
                        <Image src={imageUrl} alt={item.product.name} fill sizes="80px" className="object-cover" />
                      )}
                    </Link>

                    <div className="flex-1">
                      <Link href={`/products/${item.product.id}`} className="font-medium text-gray-900 hover:underline">
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-sm text-gray-600">
                        Quantity: {item.quantity} × {formatCurrency(item.unitAmount, order.currency)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.unitAmount * item.quantity, order.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersListClient;
