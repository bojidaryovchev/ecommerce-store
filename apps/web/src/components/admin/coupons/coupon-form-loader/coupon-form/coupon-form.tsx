"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCoupon, updateCoupon } from "@/mutations/coupons";
import { couponPayload, couponSchema, type CouponInput } from "@/schemas/coupon.schema";
import type { Coupon } from "@ecommerce/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  coupon?: Coupon;
}

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  ) : null;

/** Create a Stripe coupon, or rename one (Stripe fixes the rest once created). Amounts are in euros. */
const CouponForm: React.FC<Props> = ({ coupon }) => {
  const router = useRouter();
  const isEditing = !!coupon;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    mode: "onTouched",
    defaultValues: {
      name: coupon?.name ?? "",
      discountType: coupon?.amountOff ? "amount" : "percent",
      percentOff: coupon?.percentOff ? String(coupon.percentOff) : "",
      amountOff: coupon?.amountOff ? String(coupon.amountOff / 100).replace(".", ",") : "",
      currency: (coupon?.currency as CouponInput["currency"] | undefined) ?? "eur",
      duration: coupon?.duration ?? "once",
      durationInMonths: coupon?.durationInMonths ? String(coupon.durationInMonths) : "",
      maxRedemptions: coupon?.maxRedemptions ? String(coupon.maxRedemptions) : "",
    },
  });
  const [discountType, duration] = useWatch({ control, name: ["discountType", "duration"] });

  const onSubmit = async (values: CouponInput) => {
    const result = isEditing
      ? await updateCoupon(coupon.id, { name: values.name || undefined })
      : await createCoupon(couponPayload(values));
    if (result.success) {
      toast.success(isEditing ? "Coupon updated" : "Coupon created");
      router.push("/admin/coupons");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };
  const invalid = (name: keyof CouponInput) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `coupon-${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="coupon-name">Name</Label>
        <Input id="coupon-name" {...register("name")} {...invalid("name")} placeholder="e.g. Summer Sale 20% Off" />
        <FieldError id="coupon-name-error" message={errors.name?.message} />
      </div>

      {!isEditing && (
        <>
          <div className="space-y-2">
            <Label htmlFor="coupon-discountType">Discount type</Label>
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="coupon-discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="amount">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {discountType === "percent" ? (
            <div className="space-y-2">
              <Label htmlFor="coupon-percentOff">
                Percent off <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coupon-percentOff"
                inputMode="numeric"
                {...register("percentOff")}
                {...invalid("percentOff")}
                placeholder="e.g. 20"
              />
              <FieldError id="coupon-percentOff-error" message={errors.percentOff?.message} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-amountOff">
                  Amount off <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coupon-amountOff"
                  inputMode="decimal"
                  {...register("amountOff")}
                  {...invalid("amountOff")}
                  placeholder="e.g. 25 or 12,50"
                />
                <FieldError id="coupon-amountOff-error" message={errors.amountOff?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-currency">Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="coupon-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="coupon-duration">Duration</Label>
            <Controller
              control={control}
              name="duration"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="coupon-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                    <SelectItem value="repeating">Repeating</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {duration === "repeating" && (
            <div className="space-y-2">
              <Label htmlFor="coupon-durationInMonths">
                Duration (months) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coupon-durationInMonths"
                inputMode="numeric"
                {...register("durationInMonths")}
                {...invalid("durationInMonths")}
                placeholder="e.g. 3"
              />
              <FieldError id="coupon-durationInMonths-error" message={errors.durationInMonths?.message} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="coupon-maxRedemptions">Max redemptions (optional)</Label>
            <Input
              id="coupon-maxRedemptions"
              inputMode="numeric"
              {...register("maxRedemptions")}
              {...invalid("maxRedemptions")}
              placeholder="Leave empty for unlimited"
            />
            <FieldError id="coupon-maxRedemptions-error" message={errors.maxRedemptions?.message} />
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Coupon" : "Create Coupon"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { CouponForm };
