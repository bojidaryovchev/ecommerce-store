import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const SuccessPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="mb-8 text-gray-600">
          Thank you for your purchase. Your order has been received and is being processed. You will receive a
          confirmation email shortly.
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/orders">
            <Button className="w-full">View Orders</Button>
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

export default SuccessPage;
