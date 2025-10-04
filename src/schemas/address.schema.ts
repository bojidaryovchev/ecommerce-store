import { z } from "zod";

/**
 * Address creation/update schema
 * Validates address data with international support
 */
export const addressSchema = z.object({
  userId: z.cuid("Invalid user ID"),

  isDefault: z.boolean().default(false),
  isValidated: z.boolean().default(false),

  fullName: z.string().min(1, "Full name is required").max(255, "Full name must be less than 255 characters").trim(),

  company: z.string().max(255, "Company name must be less than 255 characters").trim().optional().nullable(),

  address1: z
    .string()
    .min(1, "Address line 1 is required")
    .max(255, "Address line 1 must be less than 255 characters")
    .trim(),

  address2: z.string().max(255, "Address line 2 must be less than 255 characters").trim().optional().nullable(),

  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters").trim(),

  state: z.string().max(100, "State/Province must be less than 100 characters").trim().optional().nullable(),

  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code must be less than 20 characters")
    .trim(),

  // ISO 3166-1 alpha-2 country codes (e.g., 'US', 'CA', 'GB')
  country: z
    .string()
    .length(2, "Country code must be 2 characters (ISO 3166-1 alpha-2)")
    .regex(/^[A-Z]{2}$/, "Country code must be uppercase (e.g., 'US', 'CA', 'GB')")
    .trim(),

  // E.164 international phone format (e.g., +1234567890)
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g., +1234567890)")
    .optional()
    .nullable(),
});

/**
 * Address update schema - all fields optional except userId
 */
export const addressUpdateSchema = addressSchema.partial().required({ userId: true });

/**
 * Guest address schema - no userId required
 */
export const guestAddressSchema = addressSchema.omit({ userId: true, isDefault: true });

/**
 * Type inference for address form data
 */
export type AddressFormData = z.infer<typeof addressSchema>;
export type AddressUpdateFormData = z.infer<typeof addressUpdateSchema>;
export type GuestAddressFormData = z.infer<typeof guestAddressSchema>;
