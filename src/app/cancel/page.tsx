import { Button } from "@/components/ui/button";
import { XCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const CancelPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-gray-900">Payment Cancelled</h1>
        <p className="mb-8 text-gray-600">
          Your payment was cancelled. No charges have been made to your account. You can return to your cart to try
          again.
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/cart">
            <Button className="w-full">Return to Cart</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CancelPage;
