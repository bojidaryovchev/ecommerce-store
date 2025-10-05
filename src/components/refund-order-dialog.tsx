"use client";

import { processRefund } from "@/actions/refund-cancel-order.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { formatOrderTotal } from "@/lib/order-utils";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface RefundOrderDialogProps {
  orderId: string;
  orderNumber: string;
  orderTotal: number; // in dollars
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RefundOrderDialog: React.FC<RefundOrderDialogProps> = ({
  orderId,
  orderNumber,
  orderTotal,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalInCents = Math.round(orderTotal * 100);
  const refundAmountInCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : 0;

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    if (refundType === "partial") {
      if (!refundAmount || parseFloat(refundAmount) <= 0) {
        toast.error("Please enter a valid refund amount");
        return;
      }

      if (refundAmountInCents > totalInCents) {
        toast.error("Refund amount cannot exceed order total");
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await processRefund(
        orderId,
        refundType === "partial" ? refundAmountInCents : undefined,
        reason.trim(),
      );

      if (result.success) {
        toast.success(
          refundType === "full" ? "Full refund processed successfully" : "Partial refund processed successfully",
        );
        onOpenChange(false);
        setRefundType("full");
        setRefundAmount("");
        setReason("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to process refund");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Refund for {orderNumber}</DialogTitle>
          <DialogDescription>
            Issue a refund to the customer. The refund will be processed through Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Total Display */}
          <div className="bg-muted/50 rounded-lg border p-3">
            <div className="text-muted-foreground text-sm font-medium">Order Total</div>
            <div className="text-2xl font-bold">{formatOrderTotal(orderTotal)}</div>
          </div>

          {/* Refund Type */}
          <div className="space-y-3">
            <Label>Refund Type</Label>
            <RadioGroup
              value={refundType}
              onValueChange={(value) => setRefundType(value as "full" | "partial")}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal">
                  Full Refund ({formatOrderTotal(orderTotal)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="font-normal">
                  Partial Refund
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Partial Refund Amount */}
          {refundType === "partial" && (
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount *</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">$</span>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={orderTotal}
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  disabled={isLoading}
                  className="pl-7"
                />
              </div>
              <p className="text-muted-foreground text-xs">Maximum: {formatOrderTotal(orderTotal)}</p>
            </div>
          )}

          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Refund Reason *</Label>
            <Textarea
              id="refund-reason"
              placeholder="Explain why this refund is being issued..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
            <strong>Note:</strong> Refunds typically take 5-10 business days to appear in the customer&apos;s account.
            This action cannot be undone.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRefund} disabled={isLoading || !reason.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Issue ${refundType === "full" ? "Full" : "Partial"} Refund`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundOrderDialog;
