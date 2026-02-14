"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPromotionCode } from "@/mutations/promotions";
import type { Coupon } from "@ecommerce/database";
import { useRouter } from "next/navigation";
import React, { useCallback, useState, useTransition } from "react";
import toast from "react-hot-toast";

interface Props {
  coupons: Coupon[];
}

const PromotionForm: React.FC<Props> = ({ coupons }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState("");
  const [couponId, setCouponId] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [firstTimeOnly, setFirstTimeOnly] = useState(false);
  const [minimumAmount, setMinimumAmount] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!couponId) {
        toast.error("Please select a coupon");
        return;
      }

      startTransition(async () => {
        const result = await createPromotionCode({
          code: code.trim(),
          couponId,
          ...(maxRedemptions ? { maxRedemptions: Number(maxRedemptions) } : {}),
          firstTimeTransaction: firstTimeOnly || undefined,
          ...(minimumAmount ? { minimumAmount: Number(minimumAmount), minimumAmountCurrency: "usd" } : {}),
        });

        if (result.success) {
          toast.success("Promotion code created");
          router.push("/admin/promotions");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      });
    },
    [code, couponId, maxRedemptions, firstTimeOnly, minimumAmount, router],
  );

  const formatCouponLabel = (coupon: Coupon) => {
    const discount = coupon.percentOff
      ? `${coupon.percentOff}% off`
      : coupon.amountOff
        ? `$${(coupon.amountOff / 100).toFixed(2)} off`
        : "";
    return `${coupon.name ?? "Unnamed"} (${discount}, ${coupon.duration})`;
  };

  if (coupons.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">You need to create a coupon first before creating a promotion code.</p>
        <Button onClick={() => router.push("/admin/coupons/new")}>Create a Coupon</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="code">
          Code <span className="text-destructive">*</span>
        </Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. SUMMER2026"
          required
        />
        <p className="text-muted-foreground text-xs">The code customers will enter at checkout. Will be uppercased.</p>
      </div>

      <div className="space-y-2">
        <Label>
          Coupon <span className="text-destructive">*</span>
        </Label>
        <Select value={couponId} onValueChange={setCouponId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a coupon" />
          </SelectTrigger>
          <SelectContent>
            {coupons.map((coupon) => (
              <SelectItem key={coupon.id} value={coupon.id}>
                {formatCouponLabel(coupon)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="minimumAmount">Minimum Order Amount in cents (optional)</Label>
        <Input
          id="minimumAmount"
          type="number"
          min={0}
          value={minimumAmount}
          onChange={(e) => setMinimumAmount(e.target.value)}
          placeholder="e.g. 5000 ($50.00)"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="firstTimeOnly"
          checked={firstTimeOnly}
          onCheckedChange={(checked) => setFirstTimeOnly(checked === true)}
        />
        <Label htmlFor="firstTimeOnly" className="cursor-pointer text-sm font-normal">
          First-time customers only
        </Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Promotion Code"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { PromotionForm };
