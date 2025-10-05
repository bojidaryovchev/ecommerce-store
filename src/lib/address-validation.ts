/**
 * Address Validation Service
 *
 * Provides address validation and normalization using Google Maps Address Validation API.
 * Includes caching, rate limiting, and error handling.
 */

import { z } from "zod";

// ============================================================================
// Types & Schemas
// ============================================================================

export const ValidationGranularity = {
  PREMISE: "PREMISE", // Building-level accuracy
  ROOFTOP: "ROOFTOP", // Rooftop-level accuracy
  RANGE_INTERPOLATED: "RANGE_INTERPOLATED", // Interpolated within a street segment
  GEOMETRIC_CENTER: "GEOMETRIC_CENTER", // Geometric center of an area
  APPROXIMATE: "APPROXIMATE", // Approximate location
} as const;

export type ValidationGranularityType = keyof typeof ValidationGranularity;

export interface AddressComponents {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AddressSuggestion extends AddressComponents {
  formattedAddress: string;
  confidence: number; // 0-100
  granularity: ValidationGranularityType;
  isComplete: boolean;
  hasInferredComponents: boolean;
  hasUnconfirmedComponents: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  granularity: ValidationGranularityType;
  verdict: {
    hasInferredComponents: boolean;
    hasReplacedComponents: boolean;
    hasUnconfirmedComponents: boolean;
    inputGranularity: ValidationGranularityType;
    validationGranularity: ValidationGranularityType;
    geocodeGranularity: ValidationGranularityType;
  };
  suggestion?: AddressSuggestion;
  originalAddress: AddressComponents;
  validatedAddress?: AddressComponents;
  formattedAddress?: string;
  issues: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  details?: unknown;
}

export const addressValidationSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(2, "Country is required").max(2, "Country must be 2-letter code"),
});

// ============================================================================
// Configuration
// ============================================================================

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_ADDRESS_VALIDATION_URL = "https://addressvalidation.googleapis.com/v1:validateAddress";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Simple in-memory cache (production should use Redis)
const validationCache = new Map<string, { result: ValidationResult; timestamp: number }>();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate cache key from address components
 */
function getCacheKey(address: AddressComponents): string {
  return JSON.stringify({
    addressLine1: address.addressLine1.toLowerCase().trim(),
    addressLine2: address.addressLine2?.toLowerCase().trim() || "",
    city: address.city.toLowerCase().trim(),
    state: address.state.toLowerCase().trim(),
    postalCode: address.postalCode.replace(/\s/g, "").toLowerCase(),
    country: address.country.toUpperCase(),
  });
}

/**
 * Check if cached result is still valid
 */
function getCachedResult(address: AddressComponents): ValidationResult | null {
  const key = getCacheKey(address);
  const cached = validationCache.get(key);

  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    validationCache.delete(key);
    return null;
  }

  return cached.result;
}

/**
 * Cache validation result
 */
function setCachedResult(address: AddressComponents, result: ValidationResult): void {
  const key = getCacheKey(address);
  validationCache.set(key, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Calculate confidence score from Google's verdict
 */
function calculateConfidence(verdict: Record<string, unknown>, geocode: Record<string, unknown>): number {
  let confidence = 100;

  // Reduce confidence based on issues
  if (verdict.hasInferredComponents) confidence -= 15;
  if (verdict.hasReplacedComponents) confidence -= 20;
  if (verdict.hasUnconfirmedComponents) confidence -= 25;

  // Adjust based on granularity
  const placeTypes = geocode?.placeTypes as string[] | undefined;
  const granularity = placeTypes?.[0] || "APPROXIMATE";
  switch (granularity) {
    case "premise":
    case "street_address":
      confidence = Math.max(confidence, 90);
      break;
    case "route":
      confidence = Math.min(confidence, 75);
      break;
    case "locality":
    case "postal_code":
      confidence = Math.min(confidence, 60);
      break;
    default:
      confidence = Math.min(confidence, 50);
  }

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Map Google's granularity to our type
 */
function mapGranularity(googleType?: string): ValidationGranularityType {
  if (!googleType) return "APPROXIMATE";

  const typeMap: Record<string, ValidationGranularityType> = {
    premise: "PREMISE",
    street_address: "ROOFTOP",
    route: "RANGE_INTERPOLATED",
    intersection: "GEOMETRIC_CENTER",
    locality: "APPROXIMATE",
    postal_code: "APPROXIMATE",
  };

  return typeMap[googleType] || "APPROXIMATE";
}

/**
 * Extract address components from Google response
 */
function extractAddressComponents(address: Record<string, unknown>): AddressComponents {
  const components = (address.addressComponents as Array<Record<string, unknown>>) || [];

  const getComponent = (types: string[]): string => {
    const component = components.find((c: Record<string, unknown>) => types.some((type) => c.componentType === type));
    const componentName = component?.componentName as { text?: string } | undefined;
    return componentName?.text || "";
  };

  const streetNumber = getComponent(["street_number"]);
  const route = getComponent(["route"]);
  const formattedAddress = (address.formattedAddress as string | undefined) || "";
  const addressLine1 = streetNumber && route ? `${streetNumber} ${route}` : streetNumber || route;

  return {
    addressLine1: addressLine1 || formattedAddress.split(",")[0] || "",
    addressLine2: getComponent(["subpremise", "floor"]) || undefined,
    city: getComponent(["locality", "sublocality", "postal_town"]),
    state: getComponent(["administrative_area_level_1"]),
    postalCode: getComponent(["postal_code"]),
    country: getComponent(["country"]),
  };
}

/**
 * Sleep for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate an address using Google Maps Address Validation API
 *
 * @param address - Address components to validate
 * @param options - Validation options
 * @returns Validation result with suggestions if available
 */
export async function validateAddress(
  address: AddressComponents,
  options: {
    enableCache?: boolean;
    enableRetry?: boolean;
  } = {},
): Promise<ValidationResult> {
  const { enableCache = true, enableRetry = true } = options;

  // Validate input
  try {
    addressValidationSchema.parse(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        confidence: 0,
        granularity: "APPROXIMATE",
        verdict: {
          hasInferredComponents: false,
          hasReplacedComponents: false,
          hasUnconfirmedComponents: true,
          inputGranularity: "APPROXIMATE",
          validationGranularity: "APPROXIMATE",
          geocodeGranularity: "APPROXIMATE",
        },
        originalAddress: address,
        issues: error.issues.map((e: { message: string }) => e.message),
      };
    }
    throw error;
  }

  // Check cache
  if (enableCache) {
    const cached = getCachedResult(address);
    if (cached) return cached;
  }

  // Check API key
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("GOOGLE_MAPS_API_KEY not configured. Skipping validation.");
    return {
      isValid: true, // Allow address without validation
      confidence: 0,
      granularity: "APPROXIMATE",
      verdict: {
        hasInferredComponents: false,
        hasReplacedComponents: false,
        hasUnconfirmedComponents: true,
        inputGranularity: "APPROXIMATE",
        validationGranularity: "APPROXIMATE",
        geocodeGranularity: "APPROXIMATE",
      },
      originalAddress: address,
      issues: ["Address validation is not configured"],
    };
  }

  // Prepare request
  const requestBody = {
    address: {
      regionCode: address.country,
      locality: address.city,
      administrativeArea: address.state,
      postalCode: address.postalCode,
      addressLines: [address.addressLine1, address.addressLine2].filter(Boolean),
    },
    enableUspsCass: address.country === "US", // Enable USPS validation for US addresses
  };

  // Make API request with retry logic
  let lastError: Error | null = null;
  const maxAttempts = enableRetry ? MAX_RETRIES + 1 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(RETRY_DELAY * attempt);
      }

      const response = await fetch(`${GOOGLE_ADDRESS_VALIDATION_URL}?key=${GOOGLE_MAPS_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(`Google API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = (await response.json()) as { result?: Record<string, unknown> };

      // Parse response
      const result = (data.result || {}) as Record<string, unknown>;
      const verdict = (result.verdict || {}) as Record<string, unknown>;
      const geocode = (result.geocode || {}) as Record<string, unknown>;
      const validatedAddress = (result.address || {}) as Record<string, unknown>;

      const confidence = calculateConfidence(verdict, geocode);
      const granularity = mapGranularity((geocode.placeTypes as string[] | undefined)?.[0]);
      const extractedComponents = extractAddressComponents(validatedAddress);

      const validationResult: ValidationResult = {
        isValid: confidence >= 50, // Consider valid if confidence >= 50%
        confidence,
        granularity,
        verdict: {
          hasInferredComponents: Boolean(verdict.hasInferredComponents),
          hasReplacedComponents: Boolean(verdict.hasReplacedComponents),
          hasUnconfirmedComponents: Boolean(verdict.hasUnconfirmedComponents),
          inputGranularity: mapGranularity(verdict.inputGranularity as string | undefined),
          validationGranularity: mapGranularity(verdict.validationGranularity as string | undefined),
          geocodeGranularity: mapGranularity(verdict.geocodeGranularity as string | undefined),
        },
        originalAddress: address,
        validatedAddress: extractedComponents,
        formattedAddress: validatedAddress.formattedAddress as string | undefined,
        issues: [],
      };

      // Add issues based on verdict
      if (verdict.hasUnconfirmedComponents) {
        validationResult.issues.push("Some address components could not be confirmed");
      }
      if (verdict.hasInferredComponents) {
        validationResult.issues.push("Some address components were inferred");
      }
      if (verdict.hasReplacedComponents) {
        validationResult.issues.push("Some address components were corrected");
      }

      // Create suggestion if address was corrected or improved
      const hasChanges =
        Boolean(verdict.hasReplacedComponents) ||
        Boolean(verdict.hasInferredComponents) ||
        (validatedAddress.formattedAddress as string) !==
          `${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;

      if (hasChanges && extractedComponents.addressLine1) {
        validationResult.suggestion = {
          ...extractedComponents,
          formattedAddress: (validatedAddress.formattedAddress as string) || "",
          confidence,
          granularity,
          isComplete: !Boolean(verdict.hasUnconfirmedComponents),
          hasInferredComponents: Boolean(verdict.hasInferredComponents),
          hasUnconfirmedComponents: Boolean(verdict.hasUnconfirmedComponents),
        };
      }

      // Cache result
      if (enableCache) {
        setCachedResult(address, validationResult);
      }

      return validationResult;
    } catch (error) {
      lastError = error as Error;
      console.error(`Address validation attempt ${attempt + 1} failed:`, error);

      // Don't retry on authentication or invalid request errors
      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("400") || error.message.includes("403"))
      ) {
        break;
      }
    }
  }

  // All retries failed - return error result
  console.error("Address validation failed after all retries:", lastError);
  return {
    isValid: false,
    confidence: 0,
    granularity: "APPROXIMATE",
    verdict: {
      hasInferredComponents: false,
      hasReplacedComponents: false,
      hasUnconfirmedComponents: true,
      inputGranularity: "APPROXIMATE",
      validationGranularity: "APPROXIMATE",
      geocodeGranularity: "APPROXIMATE",
    },
    originalAddress: address,
    issues: [`Validation service error: ${lastError?.message || "Unknown error"}`],
  };
}

/**
 * Clear validation cache (useful for testing)
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: validationCache.size,
    entries: Array.from(validationCache.entries()).map(([key, value]) => ({
      address: JSON.parse(key),
      age: Date.now() - value.timestamp,
      isValid: value.result.isValid,
      confidence: value.result.confidence,
    })),
  };
}
