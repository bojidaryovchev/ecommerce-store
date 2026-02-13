"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createPrice } from "@/mutations/prices";
import { createProduct, updateProduct } from "@/mutations/products";
import type { ProductWithDetails } from "@/types/product.type";
import type { Category } from "@ecommerce/database/schema";
import { insertProductSchema } from "@ecommerce/database/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import ImageUpload from "../ui/image-upload";

const formSchema = insertProductSchema.pick({
  name: true,
  description: true,
  active: true,
  categoryId: true,
  shippable: true,
  taxCode: true,
  unitLabel: true,
  url: true,
  statementDescriptor: true,
  images: true,
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  product?: ProductWithDetails;
  categories: Category[];
}

const ProductForm: React.FC<Props> = ({ product, categories }) => {
  const router = useRouter();
  const isEditing = !!product;
  const [images, setImages] = useState<string[]>(product?.images ?? []);

  const defaultPrice = product?.prices?.find((p) => p.id === product.defaultPriceId) ?? product?.prices?.[0];
  const [price, setPrice] = useState<string>(
    defaultPrice?.unitAmount ? (defaultPrice.unitAmount / 100).toFixed(2) : "",
  );
  const [currency, setCurrency] = useState<string>(defaultPrice?.currency ?? "usd");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      active: product?.active ?? true,
      categoryId: product?.categoryId ?? null,
      shippable: product?.shippable ?? true,
      taxCode: product?.taxCode ?? "",
      unitLabel: product?.unitLabel ?? "",
      url: product?.url ?? "",
      statementDescriptor: product?.statementDescriptor ?? "",
      images: product?.images ?? [],
    },
  });

  const handleImageUpload = (url: string | null) => {
    if (url) {
      setImages((prev) => [...prev, url]);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];

    // Delete from S3
    if (imageUrl) {
      try {
        await fetch("/api/upload/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicUrl: imageUrl }),
        });
      } catch (error) {
        console.error("Failed to delete upload:", error);
        // Continue with removal even if delete fails
      }
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const productData = {
        name: data.name,
        description: data.description,
        active: data.active,
        categoryId: data.categoryId || null,
        shippable: data.shippable,
        taxCode: data.taxCode || null,
        unitLabel: data.unitLabel || null,
        url: data.url || null,
        statementDescriptor: data.statementDescriptor || null,
        images: images.length > 0 ? images : undefined,
      };

      if (isEditing) {
        const result = await updateProduct(product.id, productData);

        if (result.success) {
          toast.success("Product updated successfully");
          router.push("/admin/products");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createProduct(productData);

        if (result.success) {
          // Create price if provided (convert dollars to cents)
          const priceInCents = price ? Math.round(parseFloat(price) * 100) : 0;
          if (priceInCents > 0) {
            await createPrice({
              productId: result.data.id,
              unitAmount: priceInCents,
              currency: currency,
              active: true,
            });
          }

          toast.success("Product created successfully");
          router.push("/admin/products");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} id="name" placeholder="Enter product name" aria-invalid={!!errors.name} />
          )}
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="description"
              value={field.value ?? ""}
              placeholder="Enter product description"
              aria-invalid={!!errors.description}
            />
          )}
        />
        {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <div className="space-y-4">
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <Image
                    src={image}
                    alt={`Product image ${index + 1}`}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
          <ImageUpload value={null} onChange={handleImageUpload} folder="products" disabled={isSubmitting} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? "none"}
              onValueChange={(value) => field.onChange(value === "none" ? null : value)}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoryId && <p className="text-destructive text-sm">{errors.categoryId.message}</p>}
      </div>

      {!isEditing && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step={0.01}
              placeholder="e.g., 23.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="cad">CAD</SelectItem>
                <SelectItem value="aud">AUD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Switch id="active" checked={field.value ?? true} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="shippable"
            control={control}
            render={({ field }) => (
              <Switch id="shippable" checked={field.value ?? true} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="shippable">Shippable</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxCode">Tax Code</Label>
        <Controller
          name="taxCode"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="taxCode"
              value={field.value ?? ""}
              placeholder="e.g., txcd_99999999"
              aria-invalid={!!errors.taxCode}
            />
          )}
        />
        {errors.taxCode && <p className="text-destructive text-sm">{errors.taxCode.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Product URL</Label>
        <Controller
          name="url"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="url"
              type="url"
              value={field.value ?? ""}
              placeholder="https://example.com/product"
              aria-invalid={!!errors.url}
            />
          )}
        />
        {errors.url && <p className="text-destructive text-sm">{errors.url.message}</p>}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
