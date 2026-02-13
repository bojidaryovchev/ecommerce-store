import { AdminSidebar } from "@/components/admin";
import React, { PropsWithChildren } from "react";

const AdminLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
