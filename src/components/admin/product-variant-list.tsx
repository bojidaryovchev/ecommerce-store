"use client";

import { deleteVariant } from "@/actions/delete-variant.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVariantDisplay, getVariantAvailability } from "@/lib/variant-utils";
import type { ProductVariant } from "@prisma/client";
import { AlertCircle, CheckCircle, Edit, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ProductVariantListProps {
  productId: string;
  variants: ProductVariant[];
  onEdit?: (variant: ProductVariant) => void;
  onDelete?: () => void;
  className?: string;
}

export function ProductVariantList({ productId, variants, onEdit, onDelete, className }: ProductVariantListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (variant: ProductVariant) => {
    setVariantToDelete(variant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!variantToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteVariant({
        id: variantToDelete.id,
        productId,
      });

      if (result.success) {
        toast.success("Variant deleted successfully");
        setDeleteDialogOpen(false);
        onDelete?.();
      } else {
        toast.error(result.error || "Failed to delete variant");
      }
    } catch (error) {
      console.error("Delete variant error:", error);
      toast.error("Failed to delete variant");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: ProductVariant["price"]) => {
    if (price === null || price === undefined) return "—";
    return `$${Number(price).toFixed(2)}`;
  };

  const getStockBadge = (variant: ProductVariant) => {
    const availability = getVariantAvailability(variant);

    switch (availability.status) {
      case "in-stock":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            In Stock
          </Badge>
        );
      case "low-stock":
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Low Stock
          </Badge>
        );
      case "out-of-stock":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Out of Stock
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Inactive
          </Badge>
        );
    }
  };

  if (variants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No variants yet. Add variants to offer different options for this product.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => {
              const options = variant.options as Record<string, string> | null;
              const optionsDisplay = formatVariantDisplay(options);

              return (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.name}</TableCell>
                  <TableCell>
                    {optionsDisplay ? (
                      <span className="text-muted-foreground text-sm">{optionsDisplay}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {variant.sku ? (
                      <code className="text-xs">{variant.sku}</code>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(variant.price)}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        variant.stockQuantity === 0
                          ? "text-red-600"
                          : variant.stockQuantity <= 5
                            ? "text-yellow-600"
                            : ""
                      }
                    >
                      {variant.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell>{getStockBadge(variant)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit?.(variant)} title="Edit variant">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(variant)}
                        title="Delete variant"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{variantToDelete?.name}&quot;? This action cannot be undone.
              {variantToDelete && (
                <>
                  <br />
                  <br />
                  <strong>Note:</strong> Variants that have been ordered cannot be deleted. Consider deactivating them
                  instead.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
