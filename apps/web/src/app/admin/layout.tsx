import { AdminSidebar } from "@/components/admin";
import Providers from "@/components/providers";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import React, { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** The admin is English-only and sits outside the storefront's locale routing. */
const AdminLayout: React.FC<PropsWithChildren> = ({ children }) => {
  setRequestLocale("en");

  return (
    <Providers locale="en" navbar={false}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />
        {/* min-w-0: wide tables scroll inside the page instead of stretching it. */}
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </Providers>
  );
};

export default AdminLayout;
