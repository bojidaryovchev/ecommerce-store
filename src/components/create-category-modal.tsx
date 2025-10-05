"use client";

import { createCategory } from "@/actions/create-category.action";
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
import { generateSlug } from "@/lib/product-utils";
import { categorySchema, type CategoryFormData } from "@/schemas/category.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

const CreateCategoryModal: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Use SWR hook for categories
  const { categories, isLoading: loadingCategories, mutate } = useCategoriesForSelect();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createCategory(data);

      if (result.success) {
        toast.success(`Category "${result.data.name}" created successfully!`);
        reset(); // Clear the form
        setOpen(false); // Close the modal
        // Revalidate SWR cache to show new category immediately
        await mutate();
        router.refresh(); // Refresh the page to show new category
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
          Create Category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>Add a new category to organize your products</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" placeholder="e.g., Electronics" {...register("name")} disabled={isSubmitting} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Slug Field */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                placeholder="e.g., electronics"
                {...register("slug")}
                disabled={isSubmitting}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const categoryName = watch("name");
                  if (categoryName) {
                    setValue("slug", generateSlug(categoryName));
                  } else {
                    toast.error("Please enter a category name first");
                  }
                }}
                disabled={isSubmitting}
                className="shrink-0"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Lowercase alphanumeric with hyphens (e.g., electronics-gadgets)
            </p>
            {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the category..."
              rows={3}
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          {/* Image Upload Field */}
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                label="Category Image"
              />
            )}
          />
          {errors.image && <p className="text-sm text-red-500">{errors.image.message}</p>}

          {/* Parent Category Field */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category (Optional)</Label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value: string) => field.onChange(value === "none" ? null : value)}
                  disabled={isSubmitting || loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top-level category)</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-muted-foreground text-sm">
              {loadingCategories ? "Loading categories..." : "Leave empty for top-level category"}
            </p>
            {errors.parentId && <p className="text-sm text-red-500">{errors.parentId.message}</p>}
          </div>

          {/* Submit Button */}
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
                "Create Category"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryModal;
