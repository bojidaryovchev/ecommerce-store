import { AdminDashboard as AdminDashboardContent } from "@/components/admin";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
};

const AdminDashboard: React.FC = () => {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
};

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-muted h-9 w-40 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-32 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="bg-muted h-96 animate-pulse rounded-lg" />
    </div>
  );
};

export default AdminDashboard;
