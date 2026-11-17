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
    <Providers locale="en">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </Providers>
  );
};

export default AdminLayout;
