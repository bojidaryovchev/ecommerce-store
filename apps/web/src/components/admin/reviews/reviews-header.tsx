import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const AdminReviewsHeader: React.FC<Props> = ({ children }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reviews</h1>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
      {children}
    </div>
  );
};

export { AdminReviewsHeader };
