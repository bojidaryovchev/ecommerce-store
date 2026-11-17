import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@ecommerce/database/schema";
import { useTranslations } from "next-intl";
import React from "react";

type Props = {
  status: OrderStatus;
};

/** Labels live in the `orders.status` messages (one per order status). */
const STATUS_CONFIG: Record<OrderStatus, { className: string }> = {
  pending: {
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  paid: {
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  processing: {
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  shipped: {
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  delivered: {
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  refunded: {
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

const OrderStatusBadge: React.FC<Props> = ({ status }) => {
  const t = useTranslations("orders.status");
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {t(status)}
    </Badge>
  );
};

export { OrderStatusBadge };
