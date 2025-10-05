import { OrderStatus, PaymentStatus } from "@prisma/client";

/**
 * Order status configuration with display properties
 */
export const ORDER_STATUS_CONFIG = {
  [OrderStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    description: "Order received, awaiting processing",
  },
  [OrderStatus.PROCESSING]: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800",
    description: "Order is being prepared",
  },
  [OrderStatus.SHIPPED]: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800",
    description: "Order has been shipped",
  },
  [OrderStatus.DELIVERED]: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    description: "Order delivered successfully",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    description: "Order was cancelled",
  },
  [OrderStatus.REFUNDED]: {
    label: "Refunded",
    color: "bg-gray-100 text-gray-800",
    description: "Order has been refunded",
  },
} as const;

/**
 * Payment status configuration with display properties
 */
export const PAYMENT_STATUS_CONFIG = {
  [PaymentStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    description: "Payment is pending",
  },
  [PaymentStatus.PAID]: {
    label: "Paid",
    color: "bg-green-100 text-green-800",
    description: "Payment completed",
  },
  [PaymentStatus.FAILED]: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
    description: "Payment failed",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Refunded",
    color: "bg-gray-100 text-gray-800",
    description: "Payment refunded",
  },
  [PaymentStatus.PARTIALLY_REFUNDED]: {
    label: "Partially Refunded",
    color: "bg-orange-100 text-orange-800",
    description: "Payment partially refunded",
  },
} as const;

/**
 * Get order status display info
 */
export function getOrderStatusInfo(status: OrderStatus) {
  return ORDER_STATUS_CONFIG[status];
}

/**
 * Get payment status display info
 */
export function getPaymentStatusInfo(status: PaymentStatus) {
  return PAYMENT_STATUS_CONFIG[status];
}

/**
 * Check if order status can be updated to target status
 */
export function canUpdateOrderStatus(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  // Can't update to same status
  if (currentStatus === targetStatus) return false;

  // Can't update delivered, cancelled, or refunded orders
  const finalStatuses: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED];
  if (finalStatuses.includes(currentStatus)) {
    return false;
  }

  // Define valid transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [], // No transitions allowed
    [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
    [OrderStatus.REFUNDED]: [], // No transitions allowed
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Generate order number (you can customize this format)
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Format order total with currency
 */
export function formatOrderTotal(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numAmount);
}

/**
 * Calculate days since order creation
 */
export function getDaysSinceOrder(createdAt: Date | string): number {
  const orderDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - orderDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
