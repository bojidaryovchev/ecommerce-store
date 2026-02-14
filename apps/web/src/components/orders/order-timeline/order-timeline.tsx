import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { OrderStatusHistoryEntry } from "@/queries/orders";
import { Clock } from "lucide-react";
import React from "react";

type TimestampFallback = {
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
};

type Props = {
  /** Audit trail entries (ordered chronologically). */
  statusHistory: OrderStatusHistoryEntry[];
  /** Fallback timestamps for orders created before the audit trail existed. */
  timestamps: TimestampFallback;
  /** Show actor info (who changed it, from→to). Defaults to false (customer view). */
  showActor?: boolean;
};

const OrderTimeline: React.FC<Props> = ({ statusHistory, timestamps, showActor = false }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusHistory.length > 0 ? (
          <div className="relative space-y-4">
            {/* Vertical line */}
            <div className="border-border absolute top-2 bottom-2 left-1.75 w-px border-l" />
            {statusHistory.map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="bg-primary relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{entry.toStatus.replace(/_/g, " ")}</span>
                    {showActor && entry.fromStatus && (
                      <span className="text-muted-foreground text-xs">from {entry.fromStatus.replace(/_/g, " ")}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatDate(entry.createdAt)}
                    {showActor && (
                      <>
                        {" · "}
                        {entry.user ? (entry.user.name ?? entry.user.email) : entry.actor}
                      </>
                    )}
                  </div>
                  {showActor && entry.note && (
                    <p className="text-muted-foreground mt-0.5 text-xs italic">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ordered</span>
              <span>{formatDate(timestamps.createdAt)}</span>
            </div>
            {timestamps.paidAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span>{formatDate(timestamps.paidAt)}</span>
              </div>
            )}
            {timestamps.shippedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipped</span>
                <span>{formatDate(timestamps.shippedAt)}</span>
              </div>
            )}
            {timestamps.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivered</span>
                <span>{formatDate(timestamps.deliveredAt)}</span>
              </div>
            )}
            {timestamps.cancelledAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancelled</span>
                <span>{formatDate(timestamps.cancelledAt)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { OrderTimeline };
