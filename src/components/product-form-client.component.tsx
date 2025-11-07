"use client";

import { prismaCreateProduct } from "@/actions/prisma-create-product.action";
import { prismaUpdateProduct } from "@/actions/prisma-update-product.action";
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
import { Textarea } from "@/components/ui/textarea";
import { productFormSchema, type ProductFormData } from "@/schemas/product-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@prisma/client";
import { LoaderIcon, PencilIcon, PlusIcon } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

interface Props {
  product?: Product;
  onSuccess: () => void;
}

const ProductFormClient: React.FC<Props> = ({ product, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || "",
          images: product.images.join(", "),
          unitAmount: 0, // Can't edit price in this form
          currency: "usd",
        }
      : {
          name: "",
          description: "",
          images: "",
          unitAmount: 0,
          currency: "usd",
        },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      const images = data.images ? data.images.split(",").map((img) => img.trim()) : [];

      if (isEditing) {
        const result = await prismaUpdateProduct({
          productId: product.id,
          name: data.name,
          description: data.description || undefined,
          images,
        });

        if (result.success) {
          setIsOpen(false);
          reset();
          onSuccess();
        } else {
          alert(result.error);
        }
      } else {
        const result = await prismaCreateProduct({
          name: data.name,
          description: data.description || undefined,
          images,
          unitAmount: data.unitAmount,
          currency: data.currency,
        });

        if (result.success) {
          setIsOpen(false);
          reset();
          onSuccess();
        } else {
          alert(result.error);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? "outline" : "default"}>
          {isEditing ? (
            <>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </>
          ) : (
            <>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Product
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update product details. Changes will sync with Stripe."
              : "Create a new product. It will be synced with Stripe."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div>
            <Label htmlFor="images">Images (comma-separated URLs)</Label>
            <Input
              id="images"
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              {...register("images")}
            />
            {errors.images && <p className="text-sm text-red-500">{errors.images.message}</p>}
          </div>

          {!isEditing && (
            <>
              <div>
                <Label htmlFor="unitAmount">Unit Amount (in cents)</Label>
                <Input id="unitAmount" type="number" {...register("unitAmount", { valueAsNumber: true })} />
                {errors.unitAmount && <p className="text-sm text-red-500">{errors.unitAmount.message}</p>}
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...register("currency")} />
                {errors.currency && <p className="text-sm text-red-500">{errors.currency.message}</p>}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormClient;
