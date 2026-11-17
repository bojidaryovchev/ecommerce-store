import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const SupplierSyncHeader: React.FC<Props> = ({ children }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier sync</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Products, prices and stock are pulled from the supplier every 4 hours, with a full refresh nightly.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
      {children}
    </div>
  );
};

export { SupplierSyncHeader };
