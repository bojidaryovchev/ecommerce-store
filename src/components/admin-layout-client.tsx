"use client";

import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import type React from "react";
import { useState } from "react";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

const AdminLayoutClient: React.FC<AdminLayoutClientProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden w-64 md:block">
        <AdminSidebar />
      </div>

      {/* Sidebar - Mobile (Overlay) */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSidebarOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />

          {/* Mobile Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
            <AdminSidebar />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="bg-muted/30 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayoutClient;
