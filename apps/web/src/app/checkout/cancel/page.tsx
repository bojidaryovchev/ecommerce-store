import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Checkout Cancelled | Ecommerce Store",
  description: "Your checkout was cancelled",
};

const CheckoutCancelPage: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <XCircle className="text-muted-foreground mx-auto h-16 w-16" />
        <h1 className="mt-6 text-3xl font-bold">Checkout Cancelled</h1>
        <p className="text-muted-foreground mt-2">
          Your checkout was cancelled. No payment was processed. Your items are still in your cart.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutCancelPage;
