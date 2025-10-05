"use client";

import { Button } from "@/components/ui/button";
import { Bell, Menu, Search, User } from "lucide-react";
import type React from "react";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-background sticky top-0 z-10 flex h-16 items-center gap-4 border-b px-6">
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Search Bar */}
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search products, orders, customers..."
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-md border pr-4 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
