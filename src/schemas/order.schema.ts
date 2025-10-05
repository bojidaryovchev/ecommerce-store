import { z } from "zod";

/**
 * Order status enum
 */
export const orderStatusEnum = z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]);

/**
 * Payment status enum
 */
export const paymentStatusEnum = z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]);

/**
 * Order creation schema
 * Validates order data including pricing, payment, and shipping
 */
export const orderSchema = z
  .object({
    orderNumber: z
      .string()
      .min(1, "Order number is required")
      .max(100, "Order number must be less than 100 characters")
      .trim(),

    userId: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val || null)
      .pipe(z.cuid("Invalid user ID").nullable()),

    // Order status
    status: orderStatusEnum.default("PENDING"),

    // Pricing - all amounts must be non-negative
    subtotal: z
      .number()
      .min(0, "Subtotal must be zero or greater")
      .max(99999999.99, "Subtotal is too large")
      .multipleOf(0.01, "Subtotal must have at most 2 decimal places"),

    taxAmount: z
      .number()
      .min(0, "Tax amount must be zero or greater")
      .max(99999999.99, "Tax amount is too large")
      .multipleOf(0.01, "Tax amount must have at most 2 decimal places")
      .default(0),

    taxRate: z
      .number()
      .min(0, "Tax rate must be zero or greater")
      .max(1, "Tax rate cannot exceed 100%")
      .multipleOf(0.0001, "Tax rate must have at most 4 decimal places")
      .default(0),

    shippingAmount: z
      .number()
      .min(0, "Shipping amount must be zero or greater")
      .max(99999999.99, "Shipping amount is too large")
      .multipleOf(0.01, "Shipping amount must have at most 2 decimal places")
      .default(0),

    discountAmount: z
      .number()
      .min(0, "Discount amount must be zero or greater")
      .max(99999999.99, "Discount amount is too large")
      .multipleOf(0.01, "Discount amount must have at most 2 decimal places")
      .default(0),

    total: z
      .number()
      .min(0, "Total must be zero or greater")
      .max(99999999.99, "Total is too large")
      .multipleOf(0.01, "Total must have at most 2 decimal places"),

    // Payment
    paymentStatus: paymentStatusEnum.default("PENDING"),

    paymentMethod: z.string().max(100, "Payment method must be less than 100 characters").optional().nullable(),

    paymentIntentId: z.string().max(255, "Payment intent ID must be less than 255 characters").optional().nullable(),

    // Shipping
    trackingNumber: z
      .string()
      .max(255, "Tracking number must be less than 255 characters")
      .trim()
      .optional()
      .nullable(),

    shippedAt: z.date().optional().nullable(),
    deliveredAt: z.date().optional().nullable(),
    cancelledAt: z.date().optional().nullable(),
    refundedAt: z.date().optional().nullable(),
    shippingAddressId: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val || null)
      .pipe(z.cuid("Invalid shipping address ID").nullable()),

    billingAddressId: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val || null)
      .pipe(z.cuid("Invalid billing address ID").nullable()),

    // Customer info for guest orders
    customerEmail: z
      .string()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters")
      .optional()
      .nullable(),

    customerName: z.string().max(255, "Customer name must be less than 255 characters").trim().optional().nullable(),

    customerPhone: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g., +1234567890)")
      .optional()
      .nullable(),

    // Gift order support
    isGift: z.boolean().default(false),

    giftMessage: z.string().max(1000, "Gift message must be less than 1000 characters").trim().optional().nullable(),

    notes: z.string().max(5000, "Notes must be less than 5000 characters").trim().optional().nullable(),
  })
  .refine(
    (data) => {
      // Guest orders must have customer email
      if (!data.userId && !data.customerEmail) {
        return false;
      }
      return true;
    },
    {
      message: "Customer email is required for guest orders",
      path: ["customerEmail"],
    },
  )
  .refine(
    (data) => {
      // Validate total calculation
      const calculatedTotal = data.subtotal + data.taxAmount + data.shippingAmount - data.discountAmount;

      // Allow for small floating point differences (within 1 cent)
      return Math.abs(data.total - calculatedTotal) < 0.01;
    },
    {
      message: "Total must equal subtotal + tax + shipping - discount",
      path: ["total"],
    },
  );

/**
 * Order update schema - for updating order status and tracking
 */
export const orderUpdateSchema = z.object({
  status: orderStatusEnum.optional(),

  paymentStatus: paymentStatusEnum.optional(),

  trackingNumber: z.string().max(255, "Tracking number must be less than 255 characters").trim().optional().nullable(),

  notes: z.string().max(5000, "Notes must be less than 5000 characters").trim().optional().nullable(),
});

/**
 * Order status update schema
 */
export const orderStatusUpdateSchema = z.object({
  status: orderStatusEnum,
  note: z.string().max(5000, "Note must be less than 5000 characters").trim().optional().nullable(),
});

/**
 * Order filter schema for querying orders
 */
export const orderFilterSchema = z.object({
  status: orderStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  customerEmail: z.string().email().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Type inference for order form data
 */
export type OrderFormData = z.infer<typeof orderSchema>;
export type OrderUpdateFormData = z.infer<typeof orderUpdateSchema>;
export type OrderStatusUpdateFormData = z.infer<typeof orderStatusUpdateSchema>;
export type OrderFilterData = z.infer<typeof orderFilterSchema>;
export type OrderStatus = z.infer<typeof orderStatusEnum>;
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;
