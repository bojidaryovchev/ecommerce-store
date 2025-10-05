import type { OrderStatus } from "@prisma/client";
import { EventEmitter } from "events";

/**
 * Order update event data
 */
export interface OrderUpdateEvent {
  orderId: string;
  userId: string | null;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  timestamp: Date;
  note?: string;
}

/**
 * Global event emitter for order updates
 * Used to broadcast real-time order status changes
 */
class OrderEventEmitter extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners for multiple order streams
    this.setMaxListeners(100);
  }

  /**
   * Emit an order status update
   */
  emitOrderUpdate(event: OrderUpdateEvent) {
    this.emit("order-updated", event);
    // Also emit order-specific event for targeted listening
    this.emit(`order:${event.orderId}`, event);
  }

  /**
   * Listen for updates to a specific order
   */
  onOrderUpdate(orderId: string, callback: (event: OrderUpdateEvent) => void) {
    this.on(`order:${orderId}`, callback);
  }

  /**
   * Remove listener for a specific order
   */
  offOrderUpdate(orderId: string, callback: (event: OrderUpdateEvent) => void) {
    this.off(`order:${orderId}`, callback);
  }
}

// Export singleton instance
export const orderEvents = new OrderEventEmitter();

/**
 * Helper to check if a status transition is valid
 */
export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["REFUNDED"], // Can only refund delivered orders
    CANCELLED: [], // Terminal state
    REFUNDED: [], // Terminal state
  };

  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Get status display information
 */
export function getStatusInfo(status: OrderStatus) {
  const statusInfo = {
    PENDING: {
      label: "Order Placed",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      description: "Your order has been received and is awaiting processing",
    },
    PROCESSING: {
      label: "Processing",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      description: "We're preparing your order for shipment",
    },
    SHIPPED: {
      label: "Shipped",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      description: "Your order is on its way",
    },
    DELIVERED: {
      label: "Delivered",
      color: "bg-green-500",
      textColor: "text-green-700",
      description: "Your order has been delivered",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "bg-red-500",
      textColor: "text-red-700",
      description: "This order has been cancelled",
    },
    REFUNDED: {
      label: "Refunded",
      color: "bg-gray-500",
      textColor: "text-gray-700",
      description: "This order has been refunded",
    },
  };

  return statusInfo[status];
}
