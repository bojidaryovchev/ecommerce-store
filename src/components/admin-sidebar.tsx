"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  FolderTree,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigationItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: FolderTree,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart,
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: Star,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn("bg-card flex h-full flex-col border-r", className)}>
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Tags className="text-primary h-6 w-6" />
          <span className="text-xl">Admin Panel</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <Link
          href="/"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <Home className="h-5 w-5" />
          <span>Back to Store</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
