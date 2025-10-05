"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderStatus } from "@/hooks/use-order-status";
import { getStatusInfo } from "@/lib/order-events";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@prisma/client";
import { CheckCircle, Clock, DollarSign, Package, Truck, XCircle } from "lucide-react";
import { useMemo } from "react";

interface OrderStatusTrackerProps {
  order: Order;
  className?: string;
}

const STATUS_STEPS = [
  { status: "PENDING" as OrderStatus, icon: Clock, label: "Order Placed" },
  { status: "PROCESSING" as OrderStatus, icon: Package, label: "Processing" },
  { status: "SHIPPED" as OrderStatus, icon: Truck, label: "Shipped" },
  { status: "DELIVERED" as OrderStatus, icon: CheckCircle, label: "Delivered" },
];

export function OrderStatusTracker({ order, className }: OrderStatusTrackerProps) {
  const { status, isConnected, connectionType, lastUpdate } = useOrderStatus(order.id, order.status);

  const statusInfo = getStatusInfo(status);

  // Determine which steps are completed
  const currentStepIndex = useMemo(() => {
    return STATUS_STEPS.findIndex((step) => step.status === status);
  }, [status]);

  // Check if order is in a terminal state (cancelled/refunded)
  const isTerminalState = status === "CANCELLED" || status === "REFUNDED";

  if (isTerminalState) {
    const Icon = status === "CANCELLED" ? XCircle : DollarSign;
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          {/* Connection Status */}
          {isConnected && (
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="outline" className="gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Live Updates ({connectionType})
              </Badge>
              {lastUpdate && (
                <span className="text-muted-foreground text-xs">Last updated: {lastUpdate.toLocaleTimeString()}</span>
              )}
            </div>
          )}

          {/* Terminal State Display */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className={cn("mb-4 rounded-full p-4", statusInfo.color)}>
              <Icon className="h-12 w-12 text-white" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">{statusInfo.label}</h3>
            <p className="text-muted-foreground">{statusInfo.description}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Connection Status */}
        {isConnected && (
          <div className="mb-6 flex items-center justify-between">
            <Badge variant="outline" className="gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Live Updates ({connectionType})
            </Badge>
            {lastUpdate && (
              <span className="text-muted-foreground text-xs">Last updated: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
        )}

        {/* Current Status Badge */}
        <div className="mb-6">
          <Badge className={cn("text-base", statusInfo.color)}>{statusInfo.label}</Badge>
          <p className="text-muted-foreground mt-2 text-sm">{statusInfo.description}</p>
        </div>

        {/* Progress Tracker */}
        <div className="relative">
          {/* Progress Line */}
          <div className="bg-muted absolute top-6 left-0 h-0.5 w-full">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{
                width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex items-start justify-between">
            {STATUS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.status}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / STATUS_STEPS.length}%` }}
                >
                  {/* Icon Circle */}
                  <div
                    className={cn(
                      "border-background relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-300",
                      isComplete && "bg-green-500 shadow-lg",
                      isActive && "bg-primary animate-pulse shadow-lg",
                      isPending && "bg-muted",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 transition-colors",
                        (isComplete || isActive) && "text-white",
                        isPending && "text-muted-foreground",
                      )}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "mt-3 text-center text-xs font-medium transition-colors sm:text-sm",
                      (isComplete || isActive) && "text-foreground",
                      isPending && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Checkmark for completed steps */}
                  {isComplete && <CheckCircle className="mt-1 h-4 w-4 text-green-500" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracking Number */}
        {order.trackingNumber && status === "SHIPPED" && (
          <div className="bg-muted/50 mt-6 rounded-lg border p-4">
            <p className="text-sm font-medium">Tracking Number</p>
            <p className="mt-1 font-mono text-lg">{order.trackingNumber}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
