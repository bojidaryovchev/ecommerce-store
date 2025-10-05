"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findVariantByOptions, getAvailableOptionValues, getVariantAvailability } from "@/lib/variant-utils";
import type { ProductVariant } from "@prisma/client";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange?: (variant: ProductVariant | null) => void;
  defaultVariantId?: string;
  style?: "dropdown" | "buttons";
  className?: string;
}

export function VariantSelector({
  variants,
  onVariantChange,
  defaultVariantId,
  style = "buttons",
  className,
}: VariantSelectorProps) {
  // Filter only active variants
  const activeVariants = useMemo(() => variants.filter((v) => v.isActive), [variants]);

  // Extract unique option types from all variants
  const optionTypes = useMemo(() => {
    const types = new Map<string, Set<string>>();

    activeVariants.forEach((variant) => {
      if (variant.options) {
        const options = variant.options as Record<string, string>;
        Object.entries(options).forEach(([name, value]) => {
          if (!types.has(name)) {
            types.set(name, new Set());
          }
          types.get(name)!.add(value);
        });
      }
    });

    return Array.from(types.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values).sort(),
    }));
  }, [activeVariants]);

  // Selected options state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Set default variant if provided
  useEffect(() => {
    if (defaultVariantId) {
      const defaultVariant = activeVariants.find((v) => v.id === defaultVariantId);
      if (defaultVariant?.options) {
        setSelectedOptions(defaultVariant.options as Record<string, string>);
      }
    }
  }, [defaultVariantId, activeVariants]);

  // Find current variant based on selected options
  const currentVariant = useMemo(() => {
    if (Object.keys(selectedOptions).length === optionTypes.length) {
      return findVariantByOptions(activeVariants, selectedOptions);
    }
    return null;
  }, [selectedOptions, activeVariants, optionTypes.length]);

  // Notify parent of variant change
  useEffect(() => {
    onVariantChange?.(currentVariant ?? null);
  }, [currentVariant, onVariantChange]);

  // Handle option selection
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  // Get availability status
  const availability = currentVariant ? getVariantAvailability(currentVariant) : null;

  // If no variants, show nothing
  if (activeVariants.length === 0) {
    return null;
  }

  // If only one variant, show its details without selector
  if (activeVariants.length === 1) {
    const variant = activeVariants[0];
    const variantAvailability = getVariantAvailability(variant);

    return (
      <div className={className}>
        {variant.options && (
          <div className="mb-2 flex flex-wrap gap-2">
            {Object.entries(variant.options as Record<string, string>).map(([name, value]) => (
              <Badge key={name} variant="secondary">
                {name}: {value}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          {variantAvailability.status === "in-stock" ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">{variantAvailability.message}</span>
            </>
          ) : variantAvailability.status === "low-stock" ? (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600">{variantAvailability.message}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">{variantAvailability.message}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Render each option type */}
        {optionTypes.map((optionType) => {
          const availableValues = getAvailableOptionValues(activeVariants, optionType.name, selectedOptions);

          return (
            <div key={optionType.name} className="space-y-2">
              <Label className="text-sm font-medium">
                {optionType.name}
                {selectedOptions[optionType.name] && (
                  <span className="text-muted-foreground ml-2 font-normal">({selectedOptions[optionType.name]})</span>
                )}
              </Label>

              {style === "buttons" ? (
                <div className="flex flex-wrap gap-2">
                  {optionType.values.map((value) => {
                    const isSelected = selectedOptions[optionType.name] === value;
                    const isAvailable = availableValues.includes(value);

                    return (
                      <Button
                        key={value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptionChange(optionType.name, value)}
                        disabled={!isAvailable}
                        className="min-w-[60px]"
                      >
                        {value}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <Select
                  value={selectedOptions[optionType.name] || ""}
                  onValueChange={(value) => handleOptionChange(optionType.name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${optionType.name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {optionType.values.map((value) => {
                      const isAvailable = availableValues.includes(value);
                      return (
                        <SelectItem key={value} value={value} disabled={!isAvailable}>
                          {value}
                          {!isAvailable && " (Out of stock)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}

        {/* Show availability status when variant is selected */}
        {availability && (
          <div className="flex items-center gap-2 rounded-lg border p-3">
            {availability.status === "in-stock" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700">In Stock</p>
                  <p className="text-muted-foreground text-xs">{availability.message}</p>
                </div>
              </>
            ) : availability.status === "low-stock" ? (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-700">Low Stock</p>
                  <p className="text-muted-foreground text-xs">{availability.message}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">
                    {availability.status === "out-of-stock" ? "Out of Stock" : "Unavailable"}
                  </p>
                  <p className="text-muted-foreground text-xs">{availability.message}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Show selected variant details */}
        {currentVariant && (
          <div className="text-muted-foreground text-sm">
            <span className="font-medium">SKU:</span> {currentVariant.sku || "N/A"}
          </div>
        )}
      </div>
    </div>
  );
}
