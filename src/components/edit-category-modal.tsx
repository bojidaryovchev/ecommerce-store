"use client";

import { type Category } from "@/actions/get-categories.action";
import { updateCategory } from "@/actions/update-category.action";
import ImageUpload from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategoriesForSelect } from "@/hooks/use-categories-for-select";
import { categorySchema, type CategoryFormData } from "@/schemas/category.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface EditCategoryModalProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ category, open, onOpenChange }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Use SWR hook for categories, excluding the current category to prevent circular reference
  const { categories, isLoading: loadingCategories, mutate } = useCategoriesForSelect([category.id]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
    },
  });

  // Reset form when category changes
  useEffect(() => {
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
    });
  }, [category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateCategory(category.id, data);

      if (result.success) {
        toast.success(`Category "${result.data.name}" updated successfully!`);
        onOpenChange(false);
        // Revalidate SWR cache to show updated category immediately
        await mutate();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update the category information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input id="edit-name" placeholder="e.g., Electronics" {...register("name")} disabled={isSubmitting} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Slug Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-slug"
              placeholder="e.g., electronics"
              {...register("slug")}
              disabled={isSubmitting}
              className="font-mono"
            />
            <p className="text-muted-foreground text-sm">
              Lowercase alphanumeric with hyphens (e.g., electronics-gadgets)
            </p>
            {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
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
            <Label htmlFor="edit-parentId">Parent Category (Optional)</Label>
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
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
