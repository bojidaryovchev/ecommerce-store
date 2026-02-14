import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

interface Props {
  children: React.ReactNode;
}

const AdminCouponsHeader: React.FC<Props> = ({ children }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Button asChild>
          <Link href="/admin/coupons/new">Create Coupon</Link>
        </Button>
      </div>
      {children}
    </div>
  );
};

export { AdminCouponsHeader };
