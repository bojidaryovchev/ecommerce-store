"use client";

import { createVariant } from "@/actions/create-variant.action";
import { getVariants } from "@/actions/get-variants.action";
import { updateVariant } from "@/actions/update-variant.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productVariantSchema, updateVariantSchema } from "@/schemas/product-variant.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProductVariant } from "@prisma/client";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

// Form schema for creating a new variant
const createFormSchema = productVariantSchema;

// Form schema for updating an existing variant
const updateFormSchema = updateVariantSchema.omit({ id: true, productId: true });

type CreateFormData = z.infer<typeof createFormSchema>;
type UpdateFormData = z.infer<typeof updateFormSchema>;

interface ProductVariantFormProps {
  productId: string;
  variant?: ProductVariant; // If provided, we're in edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface OptionType {
  name: string;
  value: string;
}

export function ProductVariantForm({ productId, variant, onSuccess, onCancel, className }: ProductVariantFormProps) {
  const isEditMode = !!variant;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [options, setOptions] = useState<OptionType[]>([]);

  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditMode ? updateFormSchema : createFormSchema),
    defaultValues: isEditMode
      ? {
          name: variant.name,
          sku: variant.sku,
          price: Number(variant.price),
          stockQuantity: variant.stockQuantity,
          isActive: variant.isActive,
        }
      : {
          productId,
          name: "",
          sku: "",
          price: 0,
          stockQuantity: 0,
          isActive: true,
        },
  });

  const watchedSku = watch("sku");

  // Initialize options from variant if in edit mode
  useEffect(() => {
    if (isEditMode && variant.options) {
      const variantOptions = variant.options as Record<string, string>;
      const optionArray = Object.entries(variantOptions).map(([name, value]) => ({
        name,
        value,
      }));
      setOptions(optionArray);
    }
  }, [isEditMode, variant]);

  // Real-time SKU validation
  useEffect(() => {
    const validateSku = async () => {
      if (!watchedSku || watchedSku.length < 2) {
        setSkuError(null);
        return;
      }

      try {
        const result = await getVariants({ productId, includeInactive: true });
        if (result.success && result.variants) {
          const skuExists = result.variants.some((v) => v.sku === watchedSku && (!isEditMode || v.id !== variant.id));

          if (skuExists) {
            setSkuError("This SKU is already in use");
          } else {
            setSkuError(null);
          }
        }
      } catch (error) {
        console.error("SKU validation error:", error);
      }
    };

    const debounce = setTimeout(validateSku, 300);
    return () => clearTimeout(debounce);
  }, [watchedSku, productId, isEditMode, variant?.id]);

  // Handle adding a new option
  const handleAddOption = () => {
    setOptions([...options, { name: "", value: "" }]);
  };

  // Handle removing an option
  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // Handle option change
  const handleOptionChange = (index: number, field: "name" | "value", value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index][field] = value;
    setOptions(updatedOptions);
  };

  // Convert options array to JSON object for submission
  const getOptionsJson = (): Record<string, string> | null => {
    if (options.length === 0) return null;

    const filtered = options.filter((opt) => opt.name && opt.value);
    if (filtered.length === 0) return null;

    return filtered.reduce(
      (acc, opt) => {
        acc[opt.name] = opt.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  };

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    if (skuError) {
      toast.error("Please fix the SKU error before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const optionsJson = getOptionsJson();

      if (isEditMode) {
        const result = await updateVariant({
          id: variant.id,
          name: data.name,
          sku: data.sku,
          price: data.price,
          stockQuantity: data.stockQuantity,
          isActive: data.isActive,
          options: optionsJson,
        });

        if (result.success) {
          toast.success("Variant updated successfully");
          onSuccess?.();
        } else {
          toast.error(result.error || "Failed to update variant");
        }
      } else {
        const createData = data as CreateFormData;
        const result = await createVariant({
          ...createData,
          options: optionsJson,
        });

        if (result.success) {
          toast.success("Variant created successfully");
          onSuccess?.();
        } else {
          toast.error(result.error || "Failed to create variant");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-4">
        {/* Variant Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Variant Name <span className="text-red-500">*</span>
          </Label>
          <Input id="name" placeholder="e.g., Large - Red" {...register("name")} disabled={isSubmitting} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        {/* SKU */}
        <div className="space-y-2">
          <Label htmlFor="sku">
            SKU <span className="text-red-500">*</span>
          </Label>
          <Input id="sku" placeholder="e.g., TSHIRT-L-RED" {...register("sku")} disabled={isSubmitting} />
          {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}
          {skuError && <p className="text-sm text-red-500">{skuError}</p>}
        </div>

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

        {/* Stock Quantity */}
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">
            Stock Quantity <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            placeholder="0"
            {...register("stockQuantity", { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity.message}</p>}
        </div>

        {/* Is Active */}
        <div className="flex items-center space-x-2">
          <input
            id="isActive"
            type="checkbox"
            {...register("isActive")}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive" className="font-normal">
            Active (visible to customers)
          </Label>
        </div>

        {/* Options Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Options</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddOption} disabled={isSubmitting}>
              <Plus className="mr-1 h-4 w-4" />
              Add Option
            </Button>
          </div>

          {options.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No options defined. Options are optional attributes like size, color, etc.
            </p>
          ) : (
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Name (e.g., Size)"
                    value={option.name}
                    onChange={(e) => handleOptionChange(index, "name", e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g., Large)"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !!skuError}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Variant" : "Create Variant"}
          </Button>
        </div>
      </div>
    </form>
  );
}
