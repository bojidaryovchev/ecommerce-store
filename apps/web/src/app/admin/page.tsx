import { AdminDashboard as AdminDashboardContent } from "@/components/admin";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
};

const AdminDashboard: React.FC = () => {
  return <AdminDashboardContent />;
};

export default AdminDashboard;
