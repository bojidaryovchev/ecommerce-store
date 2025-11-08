"use client";

import { prismaDeleteProduct } from "@/actions/prisma-delete-product.action";
import ProductFormClient from "@/components/product-form-client.component";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Price, Product } from "@prisma/client";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

type ProductWithPrices = Product & { prices: Price[] };

interface Props {
  products: ProductWithPrices[];
}

const AdminProductsListClient: React.FC<Props> = ({ products }) => {
  const router = useRouter();

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const result = await prismaDeleteProduct({ productId });

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <ProductFormClient onSuccess={handleSuccess} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <div key={product.id} className="flex items-center space-x-4 rounded-lg border p-4">
            {product.images[0] && (
              <div className="relative h-20 w-20 shrink-0">
                <Image src={product.images[0]} alt={product.name} fill className="rounded object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-semibold">{product.name}</h2>
              {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
              <div className="mt-2">
                {product.prices.map((price) => (
                  <span key={price.id} className="text-sm">
                    {formatCurrency(price.unitAmount, price.currency)}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">Status: {product.active ? "Active" : "Inactive"}</p>
            </div>
            <div className="flex space-x-2">
              <ProductFormClient product={product} onSuccess={handleSuccess} />
              <Button variant="destructive" onClick={() => handleDelete(product.id)}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}

        {products.length === 0 && <p className="py-8 text-center text-gray-500">No products found</p>}
      </div>
    </div>
  );
};

export default AdminProductsListClient;
