import { CouponFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "New Coupon | Admin",
};

const NewCouponPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Coupon</h1>
      <Suspense fallback={<FormSkeleton rows={5} />}>
        <CouponFormLoader />
      </Suspense>
    </div>
  );
};

export default NewCouponPage;
