/**
 * Tax Calculator
 *
 * Core tax calculation functions for the e-commerce store.
 * Handles inclusive/exclusive tax, rounding, and regional tax rates.
 */

import {
  DEFAULT_TAX_CONFIG,
  type TaxConfiguration,
  type TaxRate,
  type TaxType,
  isTaxExemptLocation,
} from "./tax-config";

export interface TaxCalculationInput {
  amount: number; // Base amount (price before tax)
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  productId?: string; // For checking tax exemption
  categoryId?: string; // For checking category exemption
}

export interface TaxCalculationResult {
  baseAmount: number; // Original amount
  taxRate: number; // Applied tax rate
  taxAmount: number; // Calculated tax
  totalAmount: number; // Amount + tax
  taxType: TaxType;
  taxName: string;
  isExempt: boolean;
}

// Cache for tax configuration (in-memory, resets on server restart)
let cachedTaxConfig: TaxConfiguration | null = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute

/**
 * Get tax configuration from database or use default
 */
async function getTaxConfiguration(): Promise<TaxConfiguration> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedTaxConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedTaxConfig;
  }

  // In a real implementation, you would fetch from database
  // For now, we'll use the default config
  // TODO: Add TaxConfiguration database model
  cachedTaxConfig = DEFAULT_TAX_CONFIG;
  configCacheTime = now;

  return cachedTaxConfig;
}

/**
 * Get the applicable tax rate for a location
 * Uses hierarchical lookup: postal code > city > state > country
 */
export async function getTaxRate(
  country: string,
  state?: string,
  city?: string,
  postalCode?: string,
  date: Date = new Date(),
): Promise<TaxRate | null> {
  try {
    // Check if location is tax-exempt
    if (isTaxExemptLocation(country, state)) {
      return {
        country,
        state,
        rate: 0,
        type: "EXEMPT",
        name: "Tax Exempt",
        isActive: true,
      };
    }

    // TODO: Query database for tax rates
    // For now, we'll use the predefined rates from tax-config
    const { PREDEFINED_TAX_RATES } = await import("./tax-config");

    // Build search criteria from most specific to least specific
    const searchCriteria = [
      { country, state, city, postalCode }, // Most specific
      { country, state, city, postalCode: undefined },
      { country, state, city: undefined, postalCode: undefined },
      { country, state: undefined, city: undefined, postalCode: undefined },
    ];

    // Try each criteria level
    for (const criteria of searchCriteria) {
      const matchingRate = PREDEFINED_TAX_RATES.find((rate) => {
        if (!rate.isActive) return false;
        if (rate.country !== criteria.country) return false;
        if (criteria.state && rate.state !== criteria.state) return false;
        if (criteria.city && rate.city !== criteria.city) return false;
        if (criteria.postalCode && rate.postalCode !== criteria.postalCode) return false;

        // Check effective dates
        if (rate.startDate && date < rate.startDate) return false;
        if (rate.endDate && date > rate.endDate) return false;

        return true;
      });

      if (matchingRate) {
        return matchingRate;
      }
    }

    // No specific rate found, use default
    const config = await getTaxConfiguration();
    if (config.defaultRate > 0) {
      return {
        country,
        rate: config.defaultRate,
        type: config.defaultType,
        name: "Default Tax Rate",
        isActive: true,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting tax rate:", error);
    return null;
  }
}

/**
 * Check if product or category is tax-exempt
 */
async function isTaxExempt(productId?: string, categoryId?: string): Promise<boolean> {
  const config = await getTaxConfiguration();

  if (productId && config.taxExemptProducts.includes(productId)) {
    return true;
  }

  if (categoryId && config.taxExemptCategories.includes(categoryId)) {
    return true;
  }

  return false;
}

/**
 * Round tax amount based on configuration
 */
function roundTaxAmount(amount: number, mode: "UP" | "DOWN" | "NEAREST", precision: number): number {
  const multiplier = Math.pow(10, precision);

  switch (mode) {
    case "UP":
      return Math.ceil(amount * multiplier) / multiplier;
    case "DOWN":
      return Math.floor(amount * multiplier) / multiplier;
    case "NEAREST":
    default:
      return Math.round(amount * multiplier) / multiplier;
  }
}

/**
 * Calculate tax for a given amount and location
 */
export async function calculateTax(input: TaxCalculationInput): Promise<TaxCalculationResult> {
  const config = await getTaxConfiguration();

  // Check if tax calculation is disabled
  if (!config.enabled) {
    return {
      baseAmount: input.amount,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: input.amount,
      taxType: "EXEMPT",
      taxName: "Tax Disabled",
      isExempt: true,
    };
  }

  // Check for product/category exemption
  const exempt = await isTaxExempt(input.productId, input.categoryId);
  if (exempt) {
    return {
      baseAmount: input.amount,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: input.amount,
      taxType: "EXEMPT",
      taxName: "Tax Exempt Product",
      isExempt: true,
    };
  }

  // Get applicable tax rate
  const taxRate = await getTaxRate(input.country, input.state, input.city, input.postalCode);

  if (!taxRate || taxRate.rate === 0) {
    return {
      baseAmount: input.amount,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: input.amount,
      taxType: taxRate?.type || "EXEMPT",
      taxName: taxRate?.name || "No Tax",
      isExempt: true,
    };
  }

  // Calculate tax amount
  let baseAmount = input.amount;
  let taxAmount = 0;

  if (config.includeTaxInProductPrice) {
    // Tax is included in the price - extract it
    // If price is $100 with 10% tax: base = 100 / 1.10 = 90.91, tax = 9.09
    baseAmount = input.amount / (1 + taxRate.rate);
    taxAmount = input.amount - baseAmount;
  } else {
    // Tax is added to the price
    // If price is $100 with 10% tax: base = 100, tax = 10, total = 110
    taxAmount = input.amount * taxRate.rate;
  }

  // Round tax amount
  taxAmount = roundTaxAmount(taxAmount, config.roundingMode, config.roundingPrecision);

  const totalAmount = baseAmount + taxAmount;

  return {
    baseAmount: Number(baseAmount.toFixed(config.roundingPrecision)),
    taxRate: taxRate.rate,
    taxAmount: Number(taxAmount.toFixed(config.roundingPrecision)),
    totalAmount: Number(totalAmount.toFixed(config.roundingPrecision)),
    taxType: taxRate.type,
    taxName: taxRate.name,
    isExempt: false,
  };
}

/**
 * Apply tax to a price and return formatted result
 */
export async function applyTax(
  price: number,
  country: string,
  state?: string,
  city?: string,
  postalCode?: string,
): Promise<TaxCalculationResult> {
  return calculateTax({
    amount: price,
    country,
    state,
    city,
    postalCode,
  });
}

/**
 * Calculate tax for multiple items (cart)
 */
export async function calculateCartTax(
  items: Array<{
    price: number;
    quantity: number;
    productId?: string;
    categoryId?: string;
  }>,
  country: string,
  state?: string,
  city?: string,
  postalCode?: string,
): Promise<{
  items: Array<TaxCalculationResult & { quantity: number }>;
  totalBaseAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
}> {
  const itemResults = await Promise.all(
    items.map(async (item) => {
      const result = await calculateTax({
        amount: item.price * item.quantity,
        country,
        state,
        city,
        postalCode,
        productId: item.productId,
        categoryId: item.categoryId,
      });
      return { ...result, quantity: item.quantity };
    }),
  );

  const totalBaseAmount = itemResults.reduce((sum, item) => sum + item.baseAmount, 0);
  const totalTaxAmount = itemResults.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = itemResults.reduce((sum, item) => sum + item.totalAmount, 0);

  return {
    items: itemResults,
    totalBaseAmount: Number(totalBaseAmount.toFixed(2)),
    totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

/**
 * Get tax display text for UI
 */
export function getTaxDisplayText(taxResult: TaxCalculationResult, showRate = true): string {
  if (taxResult.isExempt) {
    return "Tax Exempt";
  }

  const rateText = showRate ? ` (${(taxResult.taxRate * 100).toFixed(2)}%)` : "";
  return `${taxResult.taxName}${rateText}`;
}

/**
 * Format tax amount for display
 */
export function formatTaxAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Clear the tax configuration cache (useful for testing or after config updates)
 */
export function clearTaxConfigCache(): void {
  cachedTaxConfig = null;
  configCacheTime = 0;
}
