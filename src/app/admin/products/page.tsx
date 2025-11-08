import { prismaGetAllProducts } from "@/actions/prisma-get-all-products.action";
import AdminProductsListClient from "@/components/admin-products-list-client.component";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const AdminProductsPage: React.FC = async () => {
  const session = await auth();

  // Check if user is authenticated and has admin role
  if (!session || (!session.user.roles.includes("ADMIN") && !session.user.roles.includes("SUPER_ADMIN"))) {
    redirect("/");
  }

  // Show all products (active and inactive) in admin view
  const productsResult = await prismaGetAllProducts({ includeInactive: true });

  if (!productsResult.success) {
    return <div>Error loading products: {productsResult.error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <AdminProductsListClient products={productsResult.data} />
    </div>
  );
};

export default AdminProductsPage;
