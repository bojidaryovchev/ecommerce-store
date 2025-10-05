"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusInfo } from "@/lib/order-events";
import { cn } from "@/lib/utils";
import type { OrderStatus, OrderStatusHistory } from "@prisma/client";
import { ArrowRight, Clock } from "lucide-react";

interface OrderTimelineProps {
  history: (OrderStatusHistory & {
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
  })[];
  className?: string;
}

export function OrderTimeline({ history, className }: OrderTimelineProps) {
  // Sort by createdAt descending (newest first)
  const sortedHistory = [...history].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No status changes yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Order History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Vertical Line */}
          <div className="bg-border absolute top-2 left-4 h-[calc(100%-2rem)] w-0.5" />

          {/* Timeline Items */}
          {sortedHistory.map((entry, index) => {
            const toStatusInfo = getStatusInfo(entry.toStatus);
            const fromStatusInfo = entry.fromStatus ? getStatusInfo(entry.fromStatus) : null;

            return (
              <div key={entry.id} className="relative flex gap-4 pb-4">
                {/* Timeline Dot */}
                <div
                  className={cn(
                    "border-background relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4",
                    toStatusInfo.color,
                  )}
                >
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  {/* Status Change */}
                  <div className="flex flex-wrap items-center gap-2">
                    {fromStatusInfo && (
                      <>
                        <span className={cn("text-sm font-medium", fromStatusInfo.textColor)}>
                          {fromStatusInfo.label}
                        </span>
                        <ArrowRight className="text-muted-foreground h-4 w-4" />
                      </>
                    )}
                    <span className={cn("text-sm font-medium", toStatusInfo.textColor)}>{toStatusInfo.label}</span>
                  </div>

                  {/* Timestamp */}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(entry.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>

                  {/* Note */}
                  {entry.note && <p className="text-muted-foreground mt-2 text-sm">{entry.note}</p>}

                  {/* Latest Badge */}
                  {index === 0 && (
                    <span className="bg-primary/10 text-primary mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium">
                      Latest
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
