"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPromotionCode } from "@/mutations/promotions";
import { promotionSchema, type PromotionInput } from "@/schemas/promotion.schema";
import type { Coupon } from "@ecommerce/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  coupons: Coupon[];
}

const SYMBOLS: Record<string, string> = { eur: "€", usd: "$", gbp: "£" };

const formatCouponLabel = (coupon: Coupon) => {
  const discount = coupon.percentOff
    ? `${coupon.percentOff}% off`
    : coupon.amountOff
      ? `${(coupon.amountOff / 100).toFixed(2)} ${SYMBOLS[coupon.currency ?? ""] ?? coupon.currency?.toUpperCase() ?? ""} off`
      : "";
  return `${coupon.name ?? "Unnamed"} (${discount}, ${coupon.duration})`;
};

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  ) : null;

/** A code customers type at checkout, on one of the shop's Stripe coupons. */
const PromotionForm: React.FC<Props> = ({ coupons }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PromotionInput>({
    resolver: zodResolver(promotionSchema),
    mode: "onTouched",
    defaultValues: {
      code: "",
      couponId: "",
      maxRedemptions: "",
      minimumAmount: "",
      firstTimeOnly: false,
      storefront: false,
    },
  });

  if (coupons.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">You need to create a coupon first before creating a promotion code.</p>
        <Button onClick={() => router.push("/admin/coupons/new")}>Create a Coupon</Button>
      </div>
    );
  }

  const onSubmit = async (values: PromotionInput) => {
    const minimum = values.minimumAmount ? Math.round(Number(values.minimumAmount.replace(",", ".")) * 100) : 0;
    const result = await createPromotionCode({
      code: values.code.trim().toUpperCase(),
      couponId: values.couponId,
      ...(values.maxRedemptions ? { maxRedemptions: Number(values.maxRedemptions) } : {}),
      firstTimeTransaction: values.firstTimeOnly || undefined,
      ...(minimum > 0 ? { minimumAmount: minimum, minimumAmountCurrency: "eur" } : {}),
      storefront: values.storefront || undefined,
    });
    if (result.success) {
      toast.success("Promotion code created");
      router.push("/admin/promotions");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };
  const invalid = (name: keyof PromotionInput) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `promotion-${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="promotion-code">
          Code <span className="text-destructive">*</span>
        </Label>
        <Input
          id="promotion-code"
          {...register("code")}
          {...invalid("code")}
          placeholder="e.g. SUMMER2026"
          className="uppercase placeholder:normal-case"
        />
        <p className="text-muted-foreground text-xs">The code customers will enter at checkout. Will be uppercased.</p>
        <FieldError id="promotion-code-error" message={errors.code?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="promotion-couponId">
          Coupon <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="couponId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="promotion-couponId" {...invalid("couponId")}>
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
          )}
        />
        <FieldError id="promotion-couponId-error" message={errors.couponId?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="promotion-maxRedemptions">Max redemptions (optional)</Label>
        <Input
          id="promotion-maxRedemptions"
          inputMode="numeric"
          {...register("maxRedemptions")}
          {...invalid("maxRedemptions")}
          placeholder="Leave empty for unlimited"
        />
        <FieldError id="promotion-maxRedemptions-error" message={errors.maxRedemptions?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="promotion-minimumAmount">Minimum order in euros (optional)</Label>
        <Input
          id="promotion-minimumAmount"
          inputMode="decimal"
          {...register("minimumAmount")}
          {...invalid("minimumAmount")}
          placeholder="e.g. 50"
        />
        <FieldError id="promotion-minimumAmount-error" message={errors.minimumAmount?.message} />
      </div>

      <Controller
        control={control}
        name="firstTimeOnly"
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id="promotion-firstTimeOnly"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <Label htmlFor="promotion-firstTimeOnly" className="cursor-pointer text-sm font-normal">
              First-time customers only
            </Label>
          </div>
        )}
      />

      <Controller
        control={control}
        name="storefront"
        render={({ field }) => (
          <div className="flex items-start gap-2">
            <Checkbox
              id="promotion-storefront"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="promotion-storefront" className="cursor-pointer text-sm font-normal">
              Show in the shop: a strip on the home page while the code is active (for public campaigns, not personal
              codes)
            </Label>
          </div>
        )}
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Promotion Code"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { PromotionForm };
