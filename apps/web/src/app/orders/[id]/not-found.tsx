import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";
import React from "react";

const OrderNotFound: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <Package className="text-muted-foreground mx-auto h-16 w-16" />
        <h1 className="mt-6 text-3xl font-bold">Order Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/orders">View My Orders</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default OrderNotFound;
