import { z } from "zod";

/**
 * Schema for gift order options during checkout
 * Used when customer wants to mark an order as a gift
 */
export const giftOrderOptionsSchema = z.object({
  isGift: z.boolean().default(false),
  giftMessage: z
    .string()
    .max(500, "Gift message must be 500 characters or less")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

/**
 * Schema for validating gift message separately
 * Used for real-time validation in the UI
 */
export const giftMessageSchema = z
  .string()
  .min(1, "Gift message cannot be empty")
  .max(500, "Gift message must be 500 characters or less")
  .transform((val) => val.trim());

/**
 * Schema for updating gift information on an existing order
 * Admin can add/edit gift messages after order creation
 */
export const updateGiftInfoSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  isGift: z.boolean(),
  giftMessage: z
    .string()
    .max(500, "Gift message must be 500 characters or less")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

/**
 * Extended schema with optional recipient information
 * Can be used for future enhancements (gift notifications)
 */
export const extendedGiftOrderSchema = giftOrderOptionsSchema.extend({
  recipientName: z
    .string()
    .min(1, "Recipient name is required")
    .max(100, "Recipient name must be 100 characters or less")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  recipientEmail: z
    .string()
    .email("Invalid recipient email address")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  sendGiftNotification: z.boolean().default(false),
});

/**
 * Schema for gift message moderation/filtering
 * Used to validate content before saving
 */
export const moderateGiftMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  strictMode: z.boolean().default(false), // Stricter content filtering
});

// Type exports for TypeScript
export type GiftOrderOptions = z.infer<typeof giftOrderOptionsSchema>;
export type GiftMessage = z.infer<typeof giftMessageSchema>;
export type UpdateGiftInfo = z.infer<typeof updateGiftInfoSchema>;
export type ExtendedGiftOrder = z.infer<typeof extendedGiftOrderSchema>;
export type ModerateGiftMessage = z.infer<typeof moderateGiftMessageSchema>;
