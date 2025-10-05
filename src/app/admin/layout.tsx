import AdminLayoutClient from "@/components/admin-layout-client";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | Admin",
    default: "Admin Dashboard",
  },
  description: "Admin dashboard for managing your e-commerce store",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
};

export default AdminLayout;
