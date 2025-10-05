"use server";

import { validateAddress as validateAddressService, type AddressComponents } from "@/lib/address-validation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================================================
// Validation Schema
// ============================================================================

const validateAddressInputSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(2, "Country is required").max(2, "Country must be 2-letter code"),
});

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Validate an address using Google Maps Address Validation API
 *
 * @param address - Address components to validate
 * @returns Validation result with suggestions if available
 */
export async function validateAddress(address: AddressComponents) {
  try {
    // Validate input
    const validated = validateAddressInputSchema.parse(address);

    // Call validation service
    const result = await validateAddressService(validated, {
      enableCache: true,
      enableRetry: true,
    });

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error("Address validation error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid address format",
        details: error.issues.map((issue: { message: string }) => issue.message),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Address validation failed",
    };
  }
}

/**
 * Validate and update an existing address record
 *
 * @param addressId - ID of the address to validate
 * @returns Updated address with validation status
 */
export async function validateAndUpdateAddress(addressId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return {
        success: false,
        error: "Address not found",
      };
    }

    // Verify ownership
    if (address.userId !== session.user.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Validate address
    const validationResult = await validateAddressService(
      {
        addressLine1: address.address1,
        addressLine2: address.address2 || undefined,
        city: address.city,
        state: address.state || "",
        postalCode: address.postalCode,
        country: address.country,
      },
      {
        enableCache: true,
        enableRetry: true,
      },
    );

    // Update address validation status
    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        isValidated: validationResult.isValid,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      address: updated,
      validation: validationResult,
    };
  } catch (error) {
    console.error("Address validation and update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to validate and update address",
    };
  }
}

/**
 * Accept a suggested address and update the record
 *
 * @param addressId - ID of the address to update
 * @param suggestion - Suggested address components
 * @returns Updated address
 */
export async function acceptAddressSuggestion(addressId: string, suggestion: AddressComponents) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return {
        success: false,
        error: "Address not found",
      };
    }

    // Verify ownership
    if (address.userId !== session.user.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Validate suggested address
    const validated = validateAddressInputSchema.parse(suggestion);

    // Update address with suggestion
    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        address1: validated.addressLine1,
        address2: validated.addressLine2 || null,
        city: validated.city,
        state: validated.state,
        postalCode: validated.postalCode,
        country: validated.country,
        isValidated: true,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      address: updated,
    };
  } catch (error) {
    console.error("Accept address suggestion error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid suggestion format",
        details: error.issues.map((issue: { message: string }) => issue.message),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to accept suggestion",
    };
  }
}

/**
 * Batch validate multiple addresses
 *
 * @param addresses - Array of addresses to validate
 * @returns Array of validation results
 */
export async function batchValidateAddresses(addresses: AddressComponents[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Validate all addresses
    const results = await Promise.all(
      addresses.map(async (address) => {
        try {
          const validated = validateAddressInputSchema.parse(address);
          const result = await validateAddressService(validated, {
            enableCache: true,
            enableRetry: false, // Don't retry in batch operations
          });
          return {
            address,
            validation: result,
            success: true,
          };
        } catch (error) {
          return {
            address,
            validation: null,
            success: false,
            error: error instanceof Error ? error.message : "Validation failed",
          };
        }
      }),
    );

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        valid: results.filter((r) => r.validation?.isValid).length,
        invalid: results.filter((r) => !r.validation?.isValid).length,
        errors: results.filter((r) => !r.success).length,
      },
    };
  } catch (error) {
    console.error("Batch validation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Batch validation failed",
    };
  }
}

/**
 * Get validation status for an address
 *
 * @param addressId - ID of the address
 * @returns Validation status
 */
export async function getAddressValidationStatus(addressId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
      select: {
        id: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        isValidated: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!address) {
      return {
        success: false,
        error: "Address not found",
      };
    }

    // Verify ownership
    if (address.userId !== session.user.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return {
      success: true,
      address: {
        id: address.id,
        isValidated: address.isValidated,
        lastValidated: address.updatedAt,
      },
    };
  } catch (error) {
    console.error("Get validation status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get validation status",
    };
  }
}
