import { DEFAULT_CURRENCY, DEFAULT_LOW_STOCK_THRESHOLD, DEFAULT_PRODUCT_SKU_PREFIX } from "@/constants";

/**
 * Product utility functions
 * Helpers for SKU generation, barcode generation, and product-related operations
 */

/**
 * Generates a SKU from product name and optional variant
 * Format: PREFIX-SLUG-RANDOM
 * Example: PRD-wireless-headphones-A1B2
 */
export function generateSKU(productName: string, prefix: string = DEFAULT_PRODUCT_SKU_PREFIX): string {
  // Convert name to slug format
  const slug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 20); // Limit length

  // Generate random alphanumeric suffix (4 characters)
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${prefix}-${slug}-${suffix}`;
}

/**
 * Generates a EAN-13 compatible barcode (13 digits)
 * Note: This generates a random number. For real use, you should:
 * - Get a GS1 company prefix
 * - Use proper check digit calculation
 * - Ensure uniqueness in your system
 */
export function generateBarcode(): string {
  // Generate 12 random digits
  const randomDigits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");

  // Calculate EAN-13 check digit
  const checkDigit = calculateEAN13CheckDigit(randomDigits);

  return randomDigits + checkDigit;
}

/**
 * Calculates the EAN-13 check digit
 * Algorithm: https://en.wikipedia.org/wiki/International_Article_Number
 */
function calculateEAN13CheckDigit(first12Digits: string): number {
  if (first12Digits.length !== 12) {
    throw new Error("EAN-13 requires exactly 12 digits");
  }

  const digits = first12Digits.split("").map(Number);

  // Sum of digits at odd positions (1st, 3rd, 5th, etc.) - multiply by 1
  const oddSum = digits.filter((_, index) => index % 2 === 0).reduce((sum, digit) => sum + digit, 0);

  // Sum of digits at even positions (2nd, 4th, 6th, etc.) - multiply by 3
  const evenSum = digits.filter((_, index) => index % 2 === 1).reduce((sum, digit) => sum + digit, 0) * 3;

  const total = oddSum + evenSum;
  const checkDigit = (10 - (total % 10)) % 10;

  return checkDigit;
}

/**
 * Validates an EAN-13 barcode
 */
export function validateEAN13Barcode(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  const first12 = barcode.substring(0, 12);
  const providedCheckDigit = parseInt(barcode[12], 10);
  const calculatedCheckDigit = calculateEAN13CheckDigit(first12);

  return providedCheckDigit === calculatedCheckDigit;
}

/**
 * Validates a SKU format
 * Checks if it matches the expected pattern: PREFIX-slug-SUFFIX
 */
export function validateSKU(sku: string): boolean {
  // Allow alphanumeric, hyphens, and underscores
  // Typical format: PREFIX-slug-SUFFIX or custom formats
  return /^[A-Z0-9]+-[a-z0-9-]+-[A-Z0-9]+$/i.test(sku);
}

/**
 * Formats price for display
 */
export function formatPrice(price: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

/**
 * Calculates discount percentage
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Checks if product is low in stock
 */
export function isLowStock(
  stockQuantity: number,
  lowStockThreshold: number | null = DEFAULT_LOW_STOCK_THRESHOLD,
): boolean {
  const threshold = lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  return stockQuantity > 0 && stockQuantity <= threshold;
}

/**
 * Checks if product is out of stock
 */
export function isOutOfStock(stockQuantity: number): boolean {
  return stockQuantity <= 0;
}

/**
 * Gets stock status with label and styling info
 */
export function getStockStatus(stockQuantity: number, lowStockThreshold: number | null = DEFAULT_LOW_STOCK_THRESHOLD) {
  if (isOutOfStock(stockQuantity)) {
    return {
      label: "Out of stock",
      status: "out-of-stock" as const,
      className: "text-red-600 bg-red-50",
    };
  }

  if (isLowStock(stockQuantity, lowStockThreshold)) {
    return {
      label: `Low stock (${stockQuantity})`,
      status: "low-stock" as const,
      className: "text-orange-600 bg-orange-50",
    };
  }

  return {
    label: `In stock (${stockQuantity})`,
    status: "in-stock" as const,
    className: "text-green-600 bg-green-50",
  };
}
