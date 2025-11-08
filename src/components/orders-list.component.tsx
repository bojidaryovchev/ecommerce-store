import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderItem, Price, Product } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import { CheckCircleIcon, ClockIcon, PackageIcon, XCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
    price: Price;
  })[];
};

interface Props {
  orders: OrderWithItems[];
}

const OrdersList: React.FC<Props> = ({ orders }) => {
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return <CheckCircleIcon className="mr-1 inline h-4 w-4" />;
      case OrderStatus.FAILED:
        return <XCircleIcon className="mr-1 inline h-4 w-4" />;
      default:
        return <ClockIcon className="mr-1 inline h-4 w-4" />;
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
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <p className="text-sm text-gray-600">Order placed</p>
              <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-bold text-gray-900">{formatCurrency(order.total, order.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p
                className={`font-medium ${
                  order.status === OrderStatus.COMPLETED
                    ? "text-green-600"
                    : order.status === OrderStatus.FAILED
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              >
                {getStatusIcon(order.status)}
                {order.status}
              </p>
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
  );
};

export default OrdersList;
