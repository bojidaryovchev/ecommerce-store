import { getProducts } from "@/actions/get-products.action";
import CreateProductModal from "@/components/create-product-modal";
import ProductsList from "@/components/products-list";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Products | Admin",
  description: "Manage your store products",
};

const AdminProductsPage: React.FC = async () => {
  const result = await getProducts();

  if (!result.success) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-2">Manage your store inventory</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error loading products: {result.error}</p>
        </div>
      </div>
    );
  }

  const products = result.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-2">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <CreateProductModal />
      </div>

      <ProductsList products={products} />
    </div>
  );
};

export default AdminProductsPage;
