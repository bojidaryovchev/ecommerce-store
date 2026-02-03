"use client";

import { deleteProduct, restoreProduct } from "@/actions/drizzle-products.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDisclosure } from "@/hooks/use-disclosure";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithPricesAndCategory } from "@/types/product.type";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  products: ProductWithPricesAndCategory[];
}

const ProductsTable: React.FC<Props> = ({ products }) => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithPricesAndCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (product: ProductWithPricesAndCategory) => {
    setSelectedProduct(product);
    onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(selectedProduct.id);

      if (result.success) {
        toast.success("Product deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
      onClose();
      setSelectedProduct(null);
    }
  };

  const handleRestore = async (product: ProductWithPricesAndCategory) => {
    try {
      const result = await restoreProduct(product.id);

      if (result.success) {
        toast.success("Product restored successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to restore product");
    }
  };

  if (products.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground mb-4">No products found</p>
        <Button asChild>
          <Link href="/admin/products/new">Create your first product</Link>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IMAGE</TableHead>
            <TableHead>NAME</TableHead>
            <TableHead>PRICE</TableHead>
            <TableHead>CATEGORY</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const defaultPrice = product.prices.find((p) => p.id === product.defaultPriceId) ?? product.prices[0];
            const productImage = product.images?.[0];

            return (
              <TableRow key={product.id}>
                <TableCell>
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
                      <span className="text-muted-foreground text-lg">{product.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    {product.description && (
                      <span className="text-muted-foreground max-w-xs truncate text-sm">{product.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {defaultPrice && defaultPrice.unitAmount !== null ? (
                    <span className="font-medium">
                      {formatCurrency(defaultPrice.unitAmount, defaultPrice.currency)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No price</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.category ? (
                    <Badge variant="secondary">{product.category.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={product.active ? "default" : "destructive"}>
                    {product.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/products/${product.id}`} target="_blank">
                            View
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                    {product.active ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(product)}
                          >
                            Delete
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-600"
                            onClick={() => handleRestore(product)}
                          >
                            Restore
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Restore</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedProduct?.name}&quot;? This will deactivate the product and
              it will no longer be visible to customers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ProductsTable;
