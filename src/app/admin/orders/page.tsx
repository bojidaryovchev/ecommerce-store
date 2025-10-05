import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage customer orders",
};

const OrdersPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-2">Manage and track customer orders</p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShoppingCart className="text-muted-foreground mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">Orders Management</h3>
          <p className="text-muted-foreground text-center">
            This section is coming soon. You&apos;ll be able to manage all customer orders here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
