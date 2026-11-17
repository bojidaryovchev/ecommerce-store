"use client";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { Heart, MapPin, Package, User } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

/** Labels live in the `account.layout.nav` messages. */
const navItems = [
  { href: "/account/profile", label: "profile", icon: User },
  { href: "/account/addresses", label: "addresses", icon: MapPin },
  { href: "/account/wishlist", label: "wishlist", icon: Heart },
  { href: "/account/orders", label: "orders", icon: Package },
];

const AccountLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTranslations("account.layout");
  // Locale-agnostic: "/en/account/orders" reads as "/account/orders".
  const pathname = usePathname();

  return (
    <main className="max-w-container py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar navigation */}
        <nav className="flex flex-row gap-1 md:w-48 md:flex-col">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Button key={item.href} asChild variant={isActive ? "secondary" : "ghost"} className="justify-start">
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {t(`nav.${item.label}`)}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* Main content */}
        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
};

export default AccountLayout;
