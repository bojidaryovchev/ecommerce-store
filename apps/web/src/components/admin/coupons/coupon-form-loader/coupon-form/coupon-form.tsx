"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCoupon, updateCoupon } from "@/mutations/coupons";
import type { Coupon } from "@ecommerce/database";
import { useRouter } from "next/navigation";
import React, { useCallback, useState, useTransition } from "react";
import toast from "react-hot-toast";

interface Props {
  coupon?: Coupon;
}

const CouponForm: React.FC<Props> = ({ coupon }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!coupon;

  const [name, setName] = useState(coupon?.name ?? "");
  const [discountType, setDiscountType] = useState<"percent" | "amount">(coupon?.amountOff ? "amount" : "percent");
  const [percentOff, setPercentOff] = useState(coupon?.percentOff ? String(coupon.percentOff) : "");
  const [amountOff, setAmountOff] = useState(coupon?.amountOff ? String(coupon.amountOff) : "");
  const [currency, setCurrency] = useState(coupon?.currency ?? "usd");
  const [duration, setDuration] = useState<"forever" | "once" | "repeating">(coupon?.duration ?? "once");
  const [durationInMonths, setDurationInMonths] = useState(
    coupon?.durationInMonths ? String(coupon.durationInMonths) : "",
  );
  const [maxRedemptions, setMaxRedemptions] = useState(coupon?.maxRedemptions ? String(coupon.maxRedemptions) : "");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      startTransition(async () => {
        if (isEditing) {
          const result = await updateCoupon(coupon.id, {
            name: name.trim() || undefined,
          });

          if (result.success) {
            toast.success("Coupon updated");
            router.push("/admin/coupons");
            router.refresh();
          } else {
            toast.error(result.error);
          }
        } else {
          const result = await createCoupon({
            name: name.trim() || undefined,
            ...(discountType === "percent"
              ? { percentOff: Number(percentOff) }
              : { amountOff: Number(amountOff), currency }),
            duration,
            ...(duration === "repeating" ? { durationInMonths: Number(durationInMonths) } : {}),
            ...(maxRedemptions ? { maxRedemptions: Number(maxRedemptions) } : {}),
          });

          if (result.success) {
            toast.success("Coupon created");
            router.push("/admin/coupons");
            router.refresh();
          } else {
            toast.error(result.error);
          }
        }
      });
    },
    [
      isEditing,
      coupon,
      name,
      discountType,
      percentOff,
      amountOff,
      currency,
      duration,
      durationInMonths,
      maxRedemptions,
      router,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Sale 20% Off"
        />
      </div>

      {!isEditing && (
        <>
          <div className="space-y-2">
            <Label>Discount Type</Label>
            <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "amount")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {discountType === "percent" ? (
            <div className="space-y-2">
              <Label htmlFor="percentOff">
                Percent Off <span className="text-destructive">*</span>
              </Label>
              <Input
                id="percentOff"
                type="number"
                min={1}
                max={100}
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value)}
                placeholder="e.g. 20"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountOff">
                  Amount Off (cents) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amountOff"
                  type="number"
                  min={1}
                  value={amountOff}
                  onChange={(e) => setAmountOff(e.target.value)}
                  placeholder="e.g. 500 ($5.00)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                    <SelectItem value="cad">CAD</SelectItem>
                    <SelectItem value="aud">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v as "forever" | "once" | "repeating")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
                <SelectItem value="repeating">Repeating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {duration === "repeating" && (
            <div className="space-y-2">
              <Label htmlFor="durationInMonths">
                Duration (months) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="durationInMonths"
                type="number"
                min={1}
                value={durationInMonths}
                onChange={(e) => setDurationInMonths(e.target.value)}
                placeholder="e.g. 3"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxRedemptions">Max Redemptions (optional)</Label>
            <Input
              id="maxRedemptions"
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Leave empty for unlimited"
            />
          </div>
        </>
      )}

      {isEditing && (
        <p className="text-muted-foreground text-sm">
          Only the coupon name can be updated after creation. Discount type, amount, and duration are set by Stripe and
          cannot be changed.
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Update Coupon" : "Create Coupon"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { CouponForm };
