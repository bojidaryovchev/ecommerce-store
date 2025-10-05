"use client";

import { createProduct } from "@/actions/create-product.action";
import ImageUpload from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategoriesForSelect } from "@/hooks/use-categories-for-select";
import { generateBarcode, generateSKU } from "@/lib/product-utils";
import { productSchema, type ProductFormData } from "@/schemas/product.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

const CreateProductModal: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Use SWR hook for categories
  const { categories, isLoading: loadingCategories } = useCategoriesForSelect();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      price: 0,
      trackInventory: true,
      stockQuantity: 0,
      requiresShipping: true,
      isActive: true,
      isFeatured: false,
    },
  });

  const trackInventory = watch("trackInventory");

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createProduct(data);

      if (result.success) {
        toast.success(`Product "${result.data.name}" created successfully!`);
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>Add a new product to your store inventory</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" placeholder="e.g., Wireless Headphones" {...register("name")} disabled={isSubmitting} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                placeholder="e.g., wireless-headphones"
                {...register("slug")}
                disabled={isSubmitting}
                className="font-mono"
              />
              <p className="text-muted-foreground text-sm">URL-friendly version (lowercase with hyphens)</p>
              {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Product description..."
                rows={4}
                {...register("description")}
                disabled={isSubmitting}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value: string) => field.onChange(value === "none" ? null : value)}
                    disabled={isSubmitting || loadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
            </div>

            {/* Product Image */}
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  label="Product Image"
                />
              )}
            />
            {errors.image && <p className="text-sm text-red-500">{errors.image.message}</p>}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>

              {/* Compare at Price */}
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("compareAtPrice", {
                    setValueAs: (v) => (v === "" || isNaN(v) ? null : parseFloat(v)),
                  })}
                  disabled={isSubmitting}
                />
                <p className="text-muted-foreground text-xs">Original price (optional)</p>
                {errors.compareAtPrice && <p className="text-sm text-red-500">{errors.compareAtPrice.message}</p>}
              </div>

              {/* Cost Price */}
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("costPrice", {
                    setValueAs: (v) => (v === "" || isNaN(v) ? null : parseFloat(v)),
                  })}
                  disabled={isSubmitting}
                />
                <p className="text-muted-foreground text-xs">Your cost (optional)</p>
                {errors.costPrice && <p className="text-sm text-red-500">{errors.costPrice.message}</p>}
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inventory</h3>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="trackInventory"
                {...register("trackInventory")}
                disabled={isSubmitting}
                className="h-4 w-4"
              />
              <Label htmlFor="trackInventory" className="cursor-pointer">
                Track inventory
              </Label>
            </div>

            {trackInventory && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Stock Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    {...register("stockQuantity", { valueAsNumber: true })}
                    disabled={isSubmitting}
                  />
                  {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity.message}</p>}
                </div>

                {/* Low Stock Threshold */}
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    placeholder="e.g., 10"
                    {...register("lowStockThreshold", {
                      setValueAs: (v) => (v === "" || isNaN(v) ? null : parseInt(v, 10)),
                    })}
                    disabled={isSubmitting}
                  />
                  <p className="text-muted-foreground text-xs">Get alerted when stock is low</p>
                  {errors.lowStockThreshold && (
                    <p className="text-sm text-red-500">{errors.lowStockThreshold.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <div className="flex gap-2">
                  <Input id="sku" placeholder="e.g., WH-001" {...register("sku")} disabled={isSubmitting} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const productName = watch("name");
                      if (productName) {
                        setValue("sku", generateSKU(productName));
                      } else {
                        toast.error("Please enter a product name first");
                      }
                    }}
                    disabled={isSubmitting}
                    className="shrink-0"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">Stock Keeping Unit</p>
                {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}
              </div>

              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    placeholder="e.g., 123456789012"
                    {...register("barcode")}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue("barcode", generateBarcode())}
                    disabled={isSubmitting}
                    className="shrink-0"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">EAN-13 format</p>
                {errors.barcode && <p className="text-sm text-red-500">{errors.barcode.message}</p>}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Status</h3>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  disabled={isSubmitting}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  {...register("isFeatured")}
                  disabled={isSubmitting}
                  className="h-4 w-4"
                />
                <Label htmlFor="isFeatured" className="cursor-pointer">
                  Featured
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresShipping"
                  {...register("requiresShipping")}
                  disabled={isSubmitting}
                  className="h-4 w-4"
                />
                <Label htmlFor="requiresShipping" className="cursor-pointer">
                  Requires Shipping
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductModal;
