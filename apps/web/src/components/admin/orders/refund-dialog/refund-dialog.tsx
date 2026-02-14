"use client";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { issueRefund } from "@/mutations/refunds";
import type { RefundReason } from "@ecommerce/database/schema";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Props = {
  orderId: string;
  totalAmount: number;
  totalRefunded: number;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: "requested_by_customer", label: "Requested by customer" },
  { value: "duplicate", label: "Duplicate charge" },
  { value: "fraudulent", label: "Fraudulent" },
];

const RefundDialog: React.FC<Props> = ({
  orderId,
  totalAmount,
  totalRefunded,
  currency,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const maxRefundable = totalAmount - totalRefunded;
  const [amountStr, setAmountStr] = useState("");
  const [reason, setReason] = useState<RefundReason | "">("");
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAmountStr((maxRefundable / 100).toFixed(2));
      setReason("");
      setIsFullRefund(true);
    }
  }, [isOpen, maxRefundable]);

  const handleFullRefundToggle = (full: boolean) => {
    setIsFullRefund(full);
    if (full) {
      setAmountStr((maxRefundable / 100).toFixed(2));
    } else {
      setAmountStr("");
    }
  };

  const amountCents = Math.round(parseFloat(amountStr || "0") * 100);
  const isValidAmount = amountCents > 0 && amountCents <= maxRefundable;

  const handleSubmit = async () => {
    if (!isValidAmount) return;

    setIsSubmitting(true);
    try {
      const result = await issueRefund({
        orderId,
        amount: amountCents,
        ...(reason ? { reason } : {}),
      });

      if (result.success) {
        toast.success(`Refund of ${formatCurrency(amountCents, currency)} issued successfully`);
        onClose();
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to issue refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Refund</DialogTitle>
          <DialogDescription>
            Refund will be processed via Stripe and credited to the original payment method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Order Amount Info */}
          <div className="bg-muted space-y-1 rounded-md p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order total</span>
              <span className="font-medium">{formatCurrency(totalAmount, currency)}</span>
            </div>
            {totalRefunded > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already refunded</span>
                <span className="font-medium text-orange-600">-{formatCurrency(totalRefunded, currency)}</span>
              </div>
            )}
            <div className="border-border flex justify-between border-t pt-1">
              <span className="text-muted-foreground">Max refundable</span>
              <span className="font-semibold">{formatCurrency(maxRefundable, currency)}</span>
            </div>
          </div>

          {/* Full vs Partial toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isFullRefund ? "default" : "outline"}
              size="sm"
              onClick={() => handleFullRefundToggle(true)}
              className="flex-1"
            >
              Full Refund
            </Button>
            <Button
              type="button"
              variant={!isFullRefund ? "default" : "outline"}
              size="sm"
              onClick={() => handleFullRefundToggle(false)}
              className="flex-1"
            >
              Partial Refund
            </Button>
          </div>

          {/* Amount input (for partial refunds) */}
          {!isFullRefund && (
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Amount ({currency.toUpperCase()})</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={(maxRefundable / 100).toFixed(2)}
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
              />
              {amountStr && !isValidAmount && (
                <p className="text-destructive text-xs">
                  Amount must be between {formatCurrency(1, currency)} and {formatCurrency(maxRefundable, currency)}
                </p>
              )}
            </div>
          )}

          {/* Reason select */}
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason (optional)</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as RefundReason)}>
              <SelectTrigger id="refund-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting || !isValidAmount}>
            {isSubmitting ? "Processing..." : `Refund ${isValidAmount ? formatCurrency(amountCents, currency) : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { RefundDialog };
