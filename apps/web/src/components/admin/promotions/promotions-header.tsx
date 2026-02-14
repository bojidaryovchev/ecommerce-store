import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

interface Props {
  children: React.ReactNode;
}

const AdminPromotionsHeader: React.FC<Props> = ({ children }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Promotion Codes</h1>
        <Button asChild>
          <Link href="/admin/promotions/new">Create Code</Link>
        </Button>
      </div>
      {children}
    </div>
  );
};

export { AdminPromotionsHeader };
