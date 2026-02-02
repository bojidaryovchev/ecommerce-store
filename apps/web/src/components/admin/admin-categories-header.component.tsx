"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

const AdminCategoriesHeader: React.FC<Props> = ({ children }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button as={Link} href="/admin/categories/new" color="primary">
          Add Category
        </Button>
      </div>
      {children}
    </div>
  );
};

export default AdminCategoriesHeader;
