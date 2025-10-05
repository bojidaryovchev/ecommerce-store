"use client";

import { updateOrderStatus, updateTrackingNumber } from "@/actions/update-order-status.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { canUpdateOrderStatus, getOrderStatusInfo, ORDER_STATUS_CONFIG } from "@/lib/order-utils";
import { orderStatusUpdateSchema } from "@/schemas/order.schema";
import type { OrderStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface OrderStatusUpdateFormProps {
  orderId: string;
  currentStatus: OrderStatus;
  currentTrackingNumber?: string | null;
  onSuccess?: () => void;
}

const OrderStatusUpdateForm: React.FC<OrderStatusUpdateFormProps> = ({
  orderId,
  currentStatus,
  currentTrackingNumber,
  onSuccess,
}) => {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState<string>(currentTrackingNumber || "");
  const [notes, setNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Get available status transitions
  const availableStatuses = Object.keys(ORDER_STATUS_CONFIG).filter(
    (s) => s !== currentStatus && canUpdateOrderStatus(currentStatus, s as OrderStatus),
  ) as OrderStatus[];

  const handleStatusUpdate = async () => {
    if (status === currentStatus) {
      toast.error("Please select a different status");
      return;
    }

    try {
      setIsUpdating(true);

      // Validate input
      const validation = orderStatusUpdateSchema.safeParse({
        status,
        note: notes || undefined,
      });

      if (!validation.success) {
        toast.error(validation.error.issues[0]?.message || "Invalid input");
        return;
      }

      // Update order status
      const result = await updateOrderStatus(orderId, validation.data);

      if (result.success) {
        toast.success(`Order status updated to ${getOrderStatusInfo(status).label}`);
        setNotes("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    if (trackingNumber.trim() === currentTrackingNumber) {
      toast.error("Tracking number is the same as current");
      return;
    }

    try {
      setIsUpdating(true);

      const result = await updateTrackingNumber(orderId, trackingNumber.trim());

      if (result.success) {
        toast.success("Tracking number updated successfully");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update tracking number");
      }
    } catch (error) {
      console.error("Error updating tracking number:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusInfo = getOrderStatusInfo(currentStatus);

  return (
    <div className="space-y-6">
      {/* Current Status Display */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <div className="text-muted-foreground mb-2 text-sm font-medium">Current Status</div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: currentStatusInfo.color }} />
          <span className="font-semibold">{currentStatusInfo.label}</span>
        </div>
      </div>

      {/* Status Update Section */}
      {availableStatuses.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status-select">Update Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)} disabled={isUpdating}>
              <SelectTrigger id="status-select">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentStatus}>{currentStatusInfo.label} (Current)</SelectItem>
                {availableStatuses.map((s) => {
                  const statusInfo = getOrderStatusInfo(s);
                  return (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: statusInfo.color }} />
                        {statusInfo.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-notes">Notes (Optional)</Label>
            <Textarea
              id="status-notes"
              placeholder="Add notes about this status update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isUpdating}
              rows={3}
            />
          </div>

          <Button onClick={handleStatusUpdate} disabled={isUpdating || status === currentStatus} className="w-full">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </div>
      ) : (
        <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No status transitions available from {currentStatusInfo.label}
        </div>
      )}

      {/* Tracking Number Section */}
      <div className="border-t pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tracking-number">Tracking Number</Label>
            <Input
              id="tracking-number"
              type="text"
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              disabled={isUpdating}
            />
            {currentTrackingNumber && <p className="text-muted-foreground text-xs">Current: {currentTrackingNumber}</p>}
          </div>

          <Button
            onClick={handleTrackingUpdate}
            disabled={isUpdating || !trackingNumber.trim() || trackingNumber.trim() === currentTrackingNumber}
            variant="outline"
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Tracking Number"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusUpdateForm;
