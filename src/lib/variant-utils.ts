import type { VariantOptionType } from "@/schemas/product-variant.schema";
import type { ProductVariant } from "@prisma/client";

/**
 * Generate all possible combinations from option types
 * Example: Size: [S, M], Color: [Red, Blue] => 4 combinations
 */
export function generateVariantCombinations(optionTypes: VariantOptionType[]): Record<string, string>[] {
  if (optionTypes.length === 0) return [];

  // Start with first option type
  let combinations: Record<string, string>[] = optionTypes[0].values.map((value) => ({
    [optionTypes[0].name]: value,
  }));

  // Add each subsequent option type
  for (let i = 1; i < optionTypes.length; i++) {
    const optionType = optionTypes[i];
    const newCombinations: Record<string, string>[] = [];

    for (const combination of combinations) {
      for (const value of optionType.values) {
        newCombinations.push({
          ...combination,
          [optionType.name]: value,
        });
      }
    }

    combinations = newCombinations;
  }

  return combinations;
}

/**
 * Format variant options for display
 * Example: { Size: "Large", Color: "Red" } => "Large / Red"
 */
export function formatVariantDisplay(
  options: Record<string, string> | null | undefined,
  separator: string = " / ",
): string {
  if (!options) return "";
  return Object.values(options).join(separator);
}

/**
 * Format variant name from options
 * Example: { Size: "Large", Color: "Red" } => "Large - Red"
 */
export function generateVariantName(options: Record<string, string>, separator: string = " - "): string {
  return Object.values(options).join(separator);
}

/**
 * Generate SKU code from variant options
 * Example: { Size: "Large", Color: "Red" } => "L-R"
 */
export function generateSkuSuffix(options: Record<string, string>): string {
  return Object.values(options)
    .map((value) => {
      // Take first letter of each word, uppercase
      return value
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    })
    .join("-");
}

/**
 * Generate full SKU for variant
 * Example: baseSku="TSHIRT", options={ Size: "Large", Color: "Red" } => "TSHIRT-L-R"
 */
export function generateVariantSku(
  baseSku: string | null | undefined,
  options: Record<string, string>,
  pattern?: string,
): string {
  if (!baseSku) {
    return generateSkuSuffix(options);
  }

  if (pattern) {
    // Replace placeholders in pattern
    // Example: "{BASE}-{Size}-{Color}" with Size="L", Color="Red" => "TSHIRT-L-Red"
    let sku = pattern.replace("{BASE}", baseSku);
    for (const [key, value] of Object.entries(options)) {
      sku = sku.replace(`{${key}}`, value);
    }
    return sku;
  }

  const suffix = generateSkuSuffix(options);
  return `${baseSku}-${suffix}`;
}

/**
 * Check if variant is available (active and in stock)
 */
export function isVariantAvailable(variant: ProductVariant, requestedQuantity: number = 1): boolean {
  return variant.isActive && variant.stockQuantity >= requestedQuantity;
}

/**
 * Get variant availability status
 */
export function getVariantAvailability(variant: ProductVariant): {
  available: boolean;
  status: "in-stock" | "low-stock" | "out-of-stock" | "inactive";
  message: string;
} {
  if (!variant.isActive) {
    return {
      available: false,
      status: "inactive",
      message: "This variant is not available",
    };
  }

  if (variant.stockQuantity === 0) {
    return {
      available: false,
      status: "out-of-stock",
      message: "Out of stock",
    };
  }

  if (variant.stockQuantity <= 5) {
    return {
      available: true,
      status: "low-stock",
      message: `Only ${variant.stockQuantity} left in stock`,
    };
  }

  return {
    available: true,
    status: "in-stock",
    message: "In stock",
  };
}

/**
 * Calculate price range from variants
 */
export function getVariantPriceRange(
  variants: ProductVariant[],
  fallbackPrice?: number,
): {
  min: number;
  max: number;
  hasRange: boolean;
} {
  const prices = variants.filter((v) => v.isActive && v.price !== null).map((v) => Number(v.price));

  if (prices.length === 0 && fallbackPrice !== undefined) {
    return {
      min: fallbackPrice,
      max: fallbackPrice,
      hasRange: false,
    };
  }

  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
      hasRange: false,
    };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    min,
    max,
    hasRange: min !== max,
  };
}

/**
 * Format price range for display
 */
export function formatPriceRange(min: number, max: number, hasRange: boolean, currency: string = "$"): string {
  if (!hasRange) {
    return `${currency}${min.toFixed(2)}`;
  }
  return `${currency}${min.toFixed(2)} - ${currency}${max.toFixed(2)}`;
}

/**
 * Get total stock quantity across all variants
 */
export function getTotalVariantStock(variants: ProductVariant[]): number {
  return variants.filter((v) => v.isActive).reduce((total, v) => total + v.stockQuantity, 0);
}

/**
 * Check if any variant is in stock
 */
export function hasVariantsInStock(variants: ProductVariant[]): boolean {
  return variants.some((v) => v.isActive && v.stockQuantity > 0);
}

/**
 * Find variant by options
 */
export function findVariantByOptions(
  variants: ProductVariant[],
  selectedOptions: Record<string, string>,
): ProductVariant | undefined {
  return variants.find((variant) => {
    if (!variant.options) return false;

    const variantOptions = variant.options as Record<string, string>;
    const keys = Object.keys(selectedOptions);

    return keys.every((key) => variantOptions[key] === selectedOptions[key]);
  });
}

/**
 * Get available option values for a specific option type
 * Example: Get all available colors for selected size
 */
export function getAvailableOptionValues(
  variants: ProductVariant[],
  optionName: string,
  selectedOptions: Partial<Record<string, string>> = {},
): string[] {
  const availableValues = new Set<string>();

  for (const variant of variants) {
    if (!variant.isActive || !variant.options) continue;

    const variantOptions = variant.options as Record<string, string>;

    // Check if variant matches all selected options (except the one we're looking for)
    const matchesSelected = Object.entries(selectedOptions).every(
      ([key, value]) => key === optionName || variantOptions[key] === value,
    );

    if (matchesSelected && variantOptions[optionName]) {
      availableValues.add(variantOptions[optionName]);
    }
  }

  return Array.from(availableValues);
}

/**
 * Check if an option value is available given current selections
 */
export function isOptionValueAvailable(
  variants: ProductVariant[],
  optionName: string,
  optionValue: string,
  selectedOptions: Partial<Record<string, string>> = {},
): boolean {
  return variants.some((variant) => {
    if (!variant.isActive || variant.stockQuantity === 0 || !variant.options) {
      return false;
    }

    const variantOptions = variant.options as Record<string, string>;

    // Check if this option value matches
    if (variantOptions[optionName] !== optionValue) {
      return false;
    }

    // Check if all other selected options match
    return Object.entries(selectedOptions).every(([key, value]) => key === optionName || variantOptions[key] === value);
  });
}

/**
 * Extract all unique option types from variants
 */
export function extractOptionTypes(variants: ProductVariant[]): string[] {
  const optionTypes = new Set<string>();

  for (const variant of variants) {
    if (!variant.options) continue;
    const variantOptions = variant.options as Record<string, string>;
    Object.keys(variantOptions).forEach((key) => optionTypes.add(key));
  }

  return Array.from(optionTypes);
}

/**
 * Extract all unique option values for a specific option type
 */
export function extractOptionValues(variants: ProductVariant[], optionName: string): string[] {
  const values = new Set<string>();

  for (const variant of variants) {
    if (!variant.options) continue;
    const variantOptions = variant.options as Record<string, string>;
    if (variantOptions[optionName]) {
      values.add(variantOptions[optionName]);
    }
  }

  return Array.from(values);
}

/**
 * Sort variants by options
 * Useful for consistent display order
 */
export function sortVariantsByOptions(variants: ProductVariant[], optionOrder: string[] = []): ProductVariant[] {
  return [...variants].sort((a, b) => {
    const aOptions = (a.options as Record<string, string>) || {};
    const bOptions = (b.options as Record<string, string>) || {};

    for (const optionName of optionOrder) {
      const aValue = aOptions[optionName] || "";
      const bValue = bOptions[optionName] || "";

      if (aValue !== bValue) {
        return aValue.localeCompare(bValue);
      }
    }

    return 0;
  });
}

/**
 * Validate that variant combinations don't create duplicates
 */
export function hasDuplicateVariants(variants: Array<{ options: Record<string, string> | null }>): boolean {
  const seen = new Set<string>();

  for (const variant of variants) {
    if (!variant.options) continue;

    const optionsKey = JSON.stringify(Object.entries(variant.options).sort(([a], [b]) => a.localeCompare(b)));

    if (seen.has(optionsKey)) {
      return true;
    }

    seen.add(optionsKey);
  }

  return false;
}

/**
 * Calculate inventory value for variants
 */
export function calculateVariantInventoryValue(variants: ProductVariant[]): number {
  return variants.reduce((total, variant) => {
    const price = variant.price ? Number(variant.price) : 0;
    return total + price * variant.stockQuantity;
  }, 0);
}
