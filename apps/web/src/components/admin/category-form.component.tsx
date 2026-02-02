"use client";

import { createCategory, updateCategory } from "@/actions/drizzle-categories.action";
import type { Category } from "@ecommerce/database/schema";
import { insertCategorySchema } from "@ecommerce/database/validators";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
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
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Name"
            placeholder="Enter category name"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            isRequired
          />
        )}
      />

      <div className="flex items-end gap-2">
        <Controller
          name="slug"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Slug"
              placeholder="category-slug"
              isInvalid={!!errors.slug}
              errorMessage={errors.slug?.message}
              isRequired
              className="flex-1"
            />
          )}
        />
        <Button type="button" variant="flat" onPress={generateSlug} className="mb-1">
          Generate
        </Button>
      </div>

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            value={field.value ?? ""}
            label="Description"
            placeholder="Enter category description"
            isInvalid={!!errors.description}
            errorMessage={errors.description?.message}
          />
        )}
      />

      <Controller
        name="image"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            value={field.value ?? ""}
            label="Image URL"
            placeholder="https://example.com/image.jpg"
            isInvalid={!!errors.image}
            errorMessage={errors.image?.message}
          />
        )}
      />

      <Controller
        name="parentId"
        control={control}
        render={({ field }) => (
          <Select
            label="Parent Category"
            placeholder="Select a parent category (optional)"
            selectedKeys={field.value ? [field.value] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string | undefined;
              field.onChange(selected ?? null);
            }}
            isInvalid={!!errors.parentId}
            errorMessage={errors.parentId?.message}
          >
            {parentCategories.map((cat) => (
              <SelectItem key={cat.id}>{cat.name}</SelectItem>
            ))}
          </Select>
        )}
      />

      <Controller
        name="sortOrder"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            type="number"
            value={String(field.value ?? 0)}
            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            label="Sort Order"
            placeholder="0"
            isInvalid={!!errors.sortOrder}
            errorMessage={errors.sortOrder?.message}
          />
        )}
      />

      <div className="flex gap-3">
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          {isEditing ? "Update Category" : "Create Category"}
        </Button>
        <Button type="button" variant="light" onPress={() => router.back()} isDisabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
