"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/promotions", label: "Promotions" },
];

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-muted/50 w-64 border-r p-4">
      <div className="mb-8">
        <Link href="/admin" className="text-xl font-bold">
          Admin Panel
        </Link>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Button key={item.href} asChild variant={isActive ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          );
        })}
      </nav>
      <div className="mt-8 border-t pt-4">
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
      </div>
    </aside>
  );
};

export { AdminSidebar };
