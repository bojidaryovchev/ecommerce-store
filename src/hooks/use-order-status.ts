"use client";

import { getStatusInfo } from "@/lib/order-events";
import type { OrderStatus } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface OrderStatusUpdate {
  status: OrderStatus;
  previousStatus?: OrderStatus;
  timestamp: string;
  note?: string;
}

interface UseOrderStatusOptions {
  onStatusChange?: (update: OrderStatusUpdate) => void;
  enableNotifications?: boolean;
  pollingInterval?: number; // milliseconds
}

export function useOrderStatus(orderId: string, initialStatus: OrderStatus, options: UseOrderStatusOptions = {}) {
  const { onStatusChange, enableNotifications = true, pollingInterval = 10000 } = options;

  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<"sse" | "polling" | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const sseAttemptedRef = useRef(false);

  // Fetch current order status
  const fetchOrderStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = (await response.json()) as { order?: { status: OrderStatus } };
        if (data.order?.status && data.order.status !== status) {
          const update: OrderStatusUpdate = {
            status: data.order.status,
            previousStatus: status,
            timestamp: new Date().toISOString(),
          };
          setStatus(data.order.status);
          setLastUpdate(new Date());
          onStatusChange?.(update);

          if (enableNotifications) {
            const newStatusInfo = getStatusInfo(data.order.status);
            const previousStatusInfo = getStatusInfo(status);
            toast.success(`Order status updated: ${previousStatusInfo.label} → ${newStatusInfo.label}`, {
              duration: 5000,
              icon: "📦",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching order status:", error);
    }
  }, [orderId, status, onStatusChange, enableNotifications]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setConnectionType("polling");
    setIsConnected(true);

    // Initial fetch
    fetchOrderStatus();

    // Set up interval
    pollingIntervalRef.current = setInterval(() => {
      fetchOrderStatus();
    }, pollingInterval);
  }, [fetchOrderStatus, pollingInterval]);

  // Set up SSE connection
  useEffect(() => {
    mountedRef.current = true;

    // Only attempt SSE once
    if (sseAttemptedRef.current) {
      return;
    }
    sseAttemptedRef.current = true;

    // Try to establish SSE connection
    try {
      const eventSource = new EventSource(`/api/orders/${orderId}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setConnectionType("sse");
        console.log(`[SSE] Connected to order ${orderId}`);
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);

          if (data.type === "connected") {
            console.log(`[SSE] Connection confirmed for order ${orderId}`);
          } else if (data.type === "order-updated") {
            const update: OrderStatusUpdate = {
              status: data.status,
              previousStatus: data.previousStatus,
              timestamp: data.timestamp,
              note: data.note,
            };

            setStatus(data.status);
            setLastUpdate(new Date(data.timestamp));
            onStatusChange?.(update);

            if (enableNotifications) {
              const newStatusInfo = getStatusInfo(data.status);
              const previousStatusInfo = data.previousStatus ? getStatusInfo(data.previousStatus) : null;

              // Customize notification based on status
              const message = previousStatusInfo
                ? `${previousStatusInfo.label} → ${newStatusInfo.label}`
                : newStatusInfo.label;

              const icon = data.status === "DELIVERED" ? "✅" : "📦";

              toast.success(`Order status updated: ${message}`, {
                duration: 5000,
                icon,
              });

              // Show note if provided
              if (data.note) {
                toast(data.note, {
                  duration: 4000,
                  icon: "ℹ️",
                });
              }
            }
          }
        } catch (error) {
          console.error("[SSE] Error parsing message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("[SSE] Connection error:", error);
        setIsConnected(false);
        eventSource.close();

        // Fallback to polling after SSE failure
        if (mountedRef.current) {
          console.log("[SSE] Falling back to polling");
          // Use setTimeout to avoid calling setState synchronously in effect
          setTimeout(() => {
            if (mountedRef.current) {
              startPolling();
            }
          }, 0);
        }
      };
    } catch (error) {
      console.error("[SSE] Failed to create EventSource:", error);
      // SSE not supported, use polling
      if (mountedRef.current) {
        // Use setTimeout to avoid calling setState synchronously in effect
        setTimeout(() => {
          if (mountedRef.current) {
            startPolling();
          }
        }, 0);
      }
    }

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [orderId, onStatusChange, enableNotifications, startPolling]);

  return {
    status,
    isConnected,
    connectionType,
    lastUpdate,
  };
}
