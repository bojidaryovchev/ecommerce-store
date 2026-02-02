"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

const AdminSidebar: React.FC = () => {
  return (
    <aside className="bg-default-50 border-default-200 w-64 border-r p-4">
      <div className="mb-8">
        <Link href="/admin" className="text-xl font-bold">
          Admin Panel
        </Link>
      </div>
      <nav className="space-y-2">
        <Button as={Link} href="/admin" variant="light" className="w-full justify-start">
          Dashboard
        </Button>
        <Button as={Link} href="/admin/categories" variant="light" className="w-full justify-start">
          Categories
        </Button>
        <Button as={Link} href="/admin/products" variant="light" className="w-full justify-start">
          Products
        </Button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
