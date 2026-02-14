"use client";

import { Button } from "@/components/ui/button";
import { Heart, MapPin, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const navItems = [
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

const AccountLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Account</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar navigation */}
        <nav className="flex flex-row gap-1 md:w-48 md:flex-col">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button key={item.href} asChild variant={isActive ? "secondary" : "ghost"} className="justify-start">
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
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
