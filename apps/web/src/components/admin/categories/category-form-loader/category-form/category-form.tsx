"use client";

import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCategory, updateCategory } from "@/mutations/categories";
import type { Category } from "@ecommerce/database/schema";
import { insertCategorySchema } from "@ecommerce/database/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const formSchema = insertCategorySchema.pick({
  name: true,
  slug: true,
  description: true,
  image: true,
  parentId: true,
  sortOrder: true,
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  category?: Category;
  parentCategories: Category[];
}

const CategoryForm: React.FC<Props> = ({ category, parentCategories }) => {
  const router = useRouter();
  const isEditing = !!category;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      image: category?.image ?? "",
      parentId: category?.parentId ?? null,
      sortOrder: category?.sortOrder ?? 0,
    },
  });

  const nameValue = useWatch({ control, name: "name" });

  const generateSlug = () => {
    const slug = (nameValue ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        const result = await updateCategory(category.id, data);

        if (result.success) {
          toast.success("Category updated successfully");
          router.push("/admin/categories");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createCategory(data);

        if (result.success) {
          toast.success("Category created successfully");
          router.push("/admin/categories");
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} id="name" placeholder="Enter category name" aria-invalid={!!errors.name} />
          )}
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <Input {...field} id="slug" placeholder="category-slug" className="flex-1" aria-invalid={!!errors.slug} />
            )}
          />
          <Button type="button" variant="secondary" onClick={generateSlug}>
            Generate
          </Button>
        </div>
        {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
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
              placeholder="Enter category description"
              aria-invalid={!!errors.description}
            />
          )}
        />
        {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <Controller
          name="image"
          control={control}
          render={({ field }) => (
            <ImageUpload value={field.value} onChange={field.onChange} folder="categories" disabled={isSubmitting} />
          )}
        />
        {errors.image && <p className="text-destructive text-sm">{errors.image.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentId">Parent Category</Label>
        <Controller
          name="parentId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? "none"}
              onValueChange={(value) => field.onChange(value === "none" ? null : value)}
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Select a parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Parent (Root Category)</SelectItem>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.parentId && <p className="text-destructive text-sm">{errors.parentId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Controller
          name="sortOrder"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="sortOrder"
              type="number"
              value={String(field.value ?? 0)}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              placeholder="0"
              aria-invalid={!!errors.sortOrder}
            />
          )}
        />
        {errors.sortOrder && <p className="text-destructive text-sm">{errors.sortOrder.message}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { CategoryForm };
