"use client";

import { cancelOrder } from "@/actions/refund-cancel-order.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface CancelOrderDialogProps {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  orderId,
  orderNumber,
  paymentStatus,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [refundPayment, setRefundPayment] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const isPaid = paymentStatus === "PAID";

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setIsLoading(true);

    try {
      const result = await cancelOrder(orderId, reason.trim(), refundPayment);

      if (result.success) {
        toast.success("Order cancelled successfully");
        onOpenChange(false);
        setReason("");
        setRefundPayment(true);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Order {orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will cancel the order and update its status. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Explain why this order is being cancelled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Refund Option */}
          {isPaid && (
            <div className="flex items-start space-x-2 rounded-lg border p-4">
              <Checkbox
                id="refund-payment"
                checked={refundPayment}
                onCheckedChange={(checked: boolean) => setRefundPayment(checked === true)}
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="refund-payment"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Process refund for this order
                </Label>
                <p className="text-muted-foreground text-sm">
                  The payment will be refunded via Stripe. The customer will receive their money back in 5-10 business
                  days.
                </p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={isLoading || !reason.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderDialog;
