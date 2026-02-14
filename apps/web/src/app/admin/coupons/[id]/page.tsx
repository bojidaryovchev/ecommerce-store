import { CouponFormLoader } from "@/components/admin";
import { FormSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Edit Coupon | Admin",
};

interface Props {
  params: Promise<{ id: string }>;
}

const EditCouponPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Coupon</h1>
      <Suspense fallback={<FormSkeleton rows={5} />}>
        <CouponFormLoader couponId={id} />
      </Suspense>
    </div>
  );
};

export default EditCouponPage;
