"use client";

import { createCategory } from "@/actions/create-category.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema, type CategoryFormData } from "@/schemas/category.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const CreateCategoryForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
        <Input
          id="slug"
          placeholder="e.g., electronics"
          {...register("slug")}
          disabled={isSubmitting}
          className="font-mono"
        />
        <p className="text-muted-foreground text-sm">Lowercase alphanumeric with hyphens (e.g., electronics-gadgets)</p>
        {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the category..."
          rows={4}
          {...register("description")}
          disabled={isSubmitting}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Image URL Field */}
      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          type="url"
          placeholder="https://example.com/category-image.jpg"
          {...register("image")}
          disabled={isSubmitting}
        />
        {errors.image && <p className="text-sm text-red-500">{errors.image.message}</p>}
      </div>

      {/* Parent Category Field */}
      <div className="space-y-2">
        <Label htmlFor="parentId">Parent Category ID (Optional)</Label>
        <Input
          id="parentId"
          placeholder="Enter parent category CUID"
          {...register("parentId")}
          disabled={isSubmitting}
          className="font-mono"
        />
        <p className="text-muted-foreground text-sm">Leave empty for top-level category</p>
        {errors.parentId && <p className="text-sm text-red-500">{errors.parentId.message}</p>}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Category"
        )}
      </Button>
    </form>
  );
};

export default CreateCategoryForm;
