import { getCouponById } from "@/queries/coupons";
import { notFound } from "next/navigation";
import React from "react";
import { CouponForm } from "./coupon-form";

interface Props {
  couponId?: string;
}

const CouponFormLoader: React.FC<Props> = async ({ couponId }) => {
  if (couponId) {
    const coupon = await getCouponById(couponId);

    if (!coupon) {
      notFound();
    }

    return <CouponForm coupon={coupon} />;
  }

  return <CouponForm />;
};

export { CouponFormLoader };
