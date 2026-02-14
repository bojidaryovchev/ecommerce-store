import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";
import React from "react";

const OrderNotFound: React.FC = () => {
  return (
    <div className="py-8 text-center">
      <Package className="text-muted-foreground mx-auto h-16 w-16" />
      <h2 className="mt-6 text-2xl font-bold">Order Not Found</h2>
      <p className="text-muted-foreground mt-2">
        The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/account/orders">Back to Orders</Link>
        </Button>
      </div>
    </div>
  );
};

export default OrderNotFound;
