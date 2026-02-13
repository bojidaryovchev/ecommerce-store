import { getDashboardStats, getRecentOrders } from "@/queries/dashboard";
import React from "react";
import { DashboardRecentOrders } from "./dashboard-recent-orders";
import { DashboardStatsCards } from "./dashboard-stats-cards";

const AdminDashboard: React.FC = async () => {
  const [stats, recentOrders] = await Promise.all([getDashboardStats(), getRecentOrders()]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <DashboardStatsCards stats={stats} />
      <DashboardRecentOrders orders={recentOrders} />
    </div>
  );
};

export { AdminDashboard };
