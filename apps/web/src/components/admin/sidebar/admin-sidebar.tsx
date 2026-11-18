"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/mailbox", label: "Mailbox" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/supplier-sync", label: "Supplier sync" },
  { href: "/admin/enrichment", label: "Enrichment" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/promotions", label: "Promotions" },
];

/**
 * The admin's navigation: a column beside the page on laptops, a bar across the top with a scrollable row of
 * sections on phones and tablets.
 */
const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-muted/50 border-b p-3 lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-4">
      <div className="flex items-center justify-between gap-3 lg:mb-8 lg:block">
        <Link href="/admin" className="text-lg font-bold lg:text-xl">
          Admin Panel
        </Link>
        <Button asChild variant="ghost" size="sm" className="lg:hidden">
          <Link href="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Store
          </Link>
        </Button>
      </div>
      <nav className="-mx-3 mt-2 flex [scrollbar-width:none] gap-1 overflow-x-auto px-3 lg:mx-0 lg:mt-0 lg:block lg:space-y-2 lg:overflow-visible lg:px-0">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn("shrink-0 justify-start lg:w-full")}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          );
        })}
      </nav>
      <div className="mt-8 hidden border-t pt-4 lg:block">
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
