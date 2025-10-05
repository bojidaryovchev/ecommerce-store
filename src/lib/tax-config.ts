/**
 * Tax Configuration
 *
 * Defines tax rates, types, and configuration for the e-commerce store.
 * Supports multiple tax types (sales tax, VAT, GST) and regional rates.
 */

export type TaxType = "SALES_TAX" | "VAT" | "GST" | "EXEMPT";

export type TaxDisplayMode = "INCLUSIVE" | "EXCLUSIVE";

export interface TaxRate {
  id?: string;
  country: string; // ISO 3166-1 alpha-2 code (e.g., "US", "CA", "GB")
  state?: string; // State/province/region code (e.g., "CA", "NY", "ON")
  city?: string; // Optional city-level tax
  postalCode?: string; // Optional postal code for hyper-local tax
  rate: number; // Tax rate as decimal (e.g., 0.0825 for 8.25%)
  type: TaxType;
  name: string; // Display name (e.g., "California Sales Tax")
  description?: string;
  startDate?: Date; // When this rate becomes effective
  endDate?: Date; // When this rate expires (optional)
  priority?: number; // Higher priority rates override lower ones
  isActive: boolean;
}

export interface TaxConfiguration {
  enabled: boolean;
  displayMode: TaxDisplayMode; // Show prices with or without tax
  defaultRate: number; // Fallback rate if no specific rate found
  defaultType: TaxType;
  roundingMode: "UP" | "DOWN" | "NEAREST"; // How to round tax amounts
  roundingPrecision: number; // Decimal places (typically 2)
  includeTaxInProductPrice: boolean; // If true, product price includes tax
  showTaxBreakdown: boolean; // Show tax breakdown in cart/checkout
  taxExemptProducts: string[]; // Product IDs that are tax-exempt
  taxExemptCategories: string[]; // Category IDs that are tax-exempt
}

/**
 * Default tax configuration
 * Can be overridden by database settings
 */
export const DEFAULT_TAX_CONFIG: TaxConfiguration = {
  enabled: true,
  displayMode: "EXCLUSIVE", // Prices shown without tax (US standard)
  defaultRate: 0.0, // No tax by default, require configuration
  defaultType: "SALES_TAX",
  roundingMode: "NEAREST",
  roundingPrecision: 2,
  includeTaxInProductPrice: false,
  showTaxBreakdown: true,
  taxExemptProducts: [],
  taxExemptCategories: [],
};

/**
 * Predefined tax rates for common regions
 * These serve as templates and starting points
 */
export const PREDEFINED_TAX_RATES: TaxRate[] = [
  // United States - State Sales Tax (examples)
  {
    country: "US",
    state: "CA",
    rate: 0.0725, // California base rate (7.25%)
    type: "SALES_TAX",
    name: "California Sales Tax",
    description: "California state sales tax (base rate, local rates may apply)",
    isActive: true,
    priority: 1,
  },
  {
    country: "US",
    state: "NY",
    rate: 0.04, // New York state rate (4%)
    type: "SALES_TAX",
    name: "New York Sales Tax",
    description: "New York state sales tax (local rates may apply)",
    isActive: true,
    priority: 1,
  },
  {
    country: "US",
    state: "TX",
    rate: 0.0625, // Texas rate (6.25%)
    type: "SALES_TAX",
    name: "Texas Sales Tax",
    description: "Texas state sales tax (local rates may apply)",
    isActive: true,
    priority: 1,
  },
  {
    country: "US",
    state: "FL",
    rate: 0.06, // Florida rate (6%)
    type: "SALES_TAX",
    name: "Florida Sales Tax",
    description: "Florida state sales tax",
    isActive: true,
    priority: 1,
  },

  // Canada - GST/PST/HST (examples)
  {
    country: "CA",
    state: "ON",
    rate: 0.13, // Ontario HST (13%)
    type: "GST",
    name: "Ontario HST",
    description: "Ontario Harmonized Sales Tax",
    isActive: true,
    priority: 1,
  },
  {
    country: "CA",
    state: "BC",
    rate: 0.12, // BC GST+PST (12%)
    type: "GST",
    name: "British Columbia GST+PST",
    description: "BC combined federal and provincial tax",
    isActive: true,
    priority: 1,
  },

  // European Union - VAT (examples)
  {
    country: "GB",
    rate: 0.2, // UK VAT (20%)
    type: "VAT",
    name: "UK VAT",
    description: "United Kingdom Value Added Tax",
    isActive: true,
    priority: 1,
  },
  {
    country: "DE",
    rate: 0.19, // Germany VAT (19%)
    type: "VAT",
    name: "Germany VAT",
    description: "German Value Added Tax",
    isActive: true,
    priority: 1,
  },
  {
    country: "FR",
    rate: 0.2, // France VAT (20%)
    type: "VAT",
    name: "France VAT",
    description: "French Value Added Tax",
    isActive: true,
    priority: 1,
  },

  // Tax-exempt placeholder
  {
    country: "US",
    state: "OR",
    rate: 0.0, // Oregon has no sales tax
    type: "EXEMPT",
    name: "Oregon - No Sales Tax",
    description: "Oregon does not have a state sales tax",
    isActive: true,
    priority: 1,
  },
];

/**
 * Get display label for tax type
 */
export function getTaxTypeLabel(type: TaxType): string {
  switch (type) {
    case "SALES_TAX":
      return "Sales Tax";
    case "VAT":
      return "VAT";
    case "GST":
      return "GST/HST";
    case "EXEMPT":
      return "Tax Exempt";
    default:
      return "Tax";
  }
}

/**
 * Format tax rate as percentage
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Check if a location has tax exemption
 */
export function isTaxExemptLocation(country: string, state?: string): boolean {
  // Known tax-exempt states in the US
  const taxExemptUSStates = ["OR", "AK", "DE", "MT", "NH"];

  if (country === "US" && state && taxExemptUSStates.includes(state)) {
    return true;
  }

  return false;
}

/**
 * Get tax rate key for caching/lookup
 */
export function getTaxRateKey(country: string, state?: string, city?: string, postalCode?: string): string {
  const parts = [country];
  if (state) parts.push(state);
  if (city) parts.push(city);
  if (postalCode) parts.push(postalCode);
  return parts.join("-").toUpperCase();
}
