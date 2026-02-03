import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import * as tables from "./tables";

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

export const insertCustomerSchema = createInsertSchema(tables.customers);
export const selectCustomerSchema = createSelectSchema(tables.customers);
export const updateCustomerSchema = insertCustomerSchema.partial().required({ id: true });

// ============================================================================
// PRODUCT & PRICING SCHEMAS
// ============================================================================

export const insertProductSchema = createInsertSchema(tables.products);
export const selectProductSchema = createSelectSchema(tables.products);
export const updateProductSchema = insertProductSchema.partial().required({ id: true });

export const insertPriceSchema = createInsertSchema(tables.prices);
export const selectPriceSchema = createSelectSchema(tables.prices);
export const updatePriceSchema = insertPriceSchema.partial().required({ id: true });

// ============================================================================
// PAYMENT PROCESSING SCHEMAS
// ============================================================================

export const insertPaymentIntentSchema = createInsertSchema(tables.paymentIntents);
export const selectPaymentIntentSchema = createSelectSchema(tables.paymentIntents);
export const updatePaymentIntentSchema = insertPaymentIntentSchema.partial().required({ id: true });

export const insertChargeSchema = createInsertSchema(tables.charges);
export const selectChargeSchema = createSelectSchema(tables.charges);

export const insertPaymentMethodSchema = createInsertSchema(tables.paymentMethods);
export const selectPaymentMethodSchema = createSelectSchema(tables.paymentMethods);

export const insertRefundSchema = createInsertSchema(tables.refunds);
export const selectRefundSchema = createSelectSchema(tables.refunds);

// ============================================================================
// SUBSCRIPTION & BILLING SCHEMAS
// ============================================================================

export const insertSubscriptionSchema = createInsertSchema(tables.subscriptions);
export const selectSubscriptionSchema = createSelectSchema(tables.subscriptions);
export const updateSubscriptionSchema = insertSubscriptionSchema.partial().required({ id: true });

export const insertSubscriptionItemSchema = createInsertSchema(tables.subscriptionItems);
export const selectSubscriptionItemSchema = createSelectSchema(tables.subscriptionItems);

export const insertInvoiceSchema = createInsertSchema(tables.invoices);
export const selectInvoiceSchema = createSelectSchema(tables.invoices);
export const updateInvoiceSchema = insertInvoiceSchema.partial().required({ id: true });

export const insertInvoiceItemSchema = createInsertSchema(tables.invoiceItems);
export const selectInvoiceItemSchema = createSelectSchema(tables.invoiceItems);

export const insertInvoiceLineItemSchema = createInsertSchema(tables.invoiceLineItems);
export const selectInvoiceLineItemSchema = createSelectSchema(tables.invoiceLineItems);

// ============================================================================
// DISCOUNT & PROMOTION SCHEMAS
// ============================================================================

export const insertCouponSchema = createInsertSchema(tables.coupons);
export const selectCouponSchema = createSelectSchema(tables.coupons);
export const updateCouponSchema = insertCouponSchema.partial().required({ id: true });

export const insertPromotionCodeSchema = createInsertSchema(tables.promotionCodes);
export const selectPromotionCodeSchema = createSelectSchema(tables.promotionCodes);

export const insertDiscountSchema = createInsertSchema(tables.discounts);
export const selectDiscountSchema = createSelectSchema(tables.discounts);

// ============================================================================
// CHECKOUT & SESSION SCHEMAS
// ============================================================================

export const insertCheckoutSessionSchema = createInsertSchema(tables.checkoutSessions);
export const selectCheckoutSessionSchema = createSelectSchema(tables.checkoutSessions);

export const insertSetupIntentSchema = createInsertSchema(tables.setupIntents);
export const selectSetupIntentSchema = createSelectSchema(tables.setupIntents);

// ============================================================================
// SHIPPING & TAX SCHEMAS
// ============================================================================

export const insertShippingRateSchema = createInsertSchema(tables.shippingRates);
export const selectShippingRateSchema = createSelectSchema(tables.shippingRates);

export const insertTaxRateSchema = createInsertSchema(tables.taxRates);
export const selectTaxRateSchema = createSelectSchema(tables.taxRates);

export const insertTaxIdSchema = createInsertSchema(tables.taxIds);
export const selectTaxIdSchema = createSelectSchema(tables.taxIds);

// ============================================================================
// OTHER STRIPE SCHEMAS
// ============================================================================

export const insertBalanceTransactionSchema = createInsertSchema(tables.balanceTransactions);
export const selectBalanceTransactionSchema = createSelectSchema(tables.balanceTransactions);

export const insertDisputeSchema = createInsertSchema(tables.disputes);
export const selectDisputeSchema = createSelectSchema(tables.disputes);

export const insertCreditNoteSchema = createInsertSchema(tables.creditNotes);
export const selectCreditNoteSchema = createSelectSchema(tables.creditNotes);

export const insertQuoteSchema = createInsertSchema(tables.quotes);
export const selectQuoteSchema = createSelectSchema(tables.quotes);

export const insertPaymentLinkSchema = createInsertSchema(tables.paymentLinks);
export const selectPaymentLinkSchema = createSelectSchema(tables.paymentLinks);

// ============================================================================
// E-COMMERCE SCHEMAS (Non-Stripe)
// ============================================================================

export const insertAddressSchema = createInsertSchema(tables.addresses);
export const selectAddressSchema = createSelectSchema(tables.addresses);
export const updateAddressSchema = insertAddressSchema.partial().required({ id: true });

export const insertOrderSchema = createInsertSchema(tables.orders);
export const selectOrderSchema = createSelectSchema(tables.orders);

export const insertOrderItemSchema = createInsertSchema(tables.orderItems);
export const selectOrderItemSchema = createSelectSchema(tables.orderItems);

export const insertCartSchema = createInsertSchema(tables.carts);
export const selectCartSchema = createSelectSchema(tables.carts);

export const insertCartItemSchema = createInsertSchema(tables.cartItems);
export const selectCartItemSchema = createSelectSchema(tables.cartItems);

export const insertCategorySchema = createInsertSchema(tables.categories);
export const selectCategorySchema = createSelectSchema(tables.categories);
export const updateCategorySchema = insertCategorySchema.partial().required({ id: true });

export const insertReviewSchema = createInsertSchema(tables.reviews);
export const selectReviewSchema = createSelectSchema(tables.reviews);

export const insertWishlistSchema = createInsertSchema(tables.wishlists);
export const selectWishlistSchema = createSelectSchema(tables.wishlists);

// ============================================================================
// AUTH SCHEMAS (Next-Auth)
// ============================================================================

export const insertUserSchema = createInsertSchema(tables.users);
export const selectUserSchema = createSelectSchema(tables.users);
export const updateUserSchema = insertUserSchema.partial().required({ id: true });

export const insertAccountSchema = createInsertSchema(tables.accounts);
export const selectAccountSchema = createSelectSchema(tables.accounts);

export const insertSessionSchema = createInsertSchema(tables.sessions);
export const selectSessionSchema = createSelectSchema(tables.sessions);

export const insertVerificationTokenSchema = createInsertSchema(tables.verificationTokens);
export const selectVerificationTokenSchema = createSelectSchema(tables.verificationTokens);

export const insertAuthenticatorSchema = createInsertSchema(tables.authenticators);
export const selectAuthenticatorSchema = createSelectSchema(tables.authenticators);

// ============================================================================
// CUSTOM VALIDATORS FOR COMMON USE CASES
// ============================================================================

/**
 * Schema for creating a new payment intent (omits auto-generated fields)
 */
export const createPaymentIntentSchema = insertPaymentIntentSchema
  .omit({
    id: true,
    created: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    amount: z.number().int().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be 3-letter ISO code"),
  });

/**
 * Schema for creating a new customer (omits auto-generated fields)
 */
export const createCustomerSchema = insertCustomerSchema
  .omit({
    id: true,
    created: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    email: z.string().email().optional().nullable(),
  });

/**
 * Schema for creating a new product
 */
export const createProductSchema = insertProductSchema
  .omit({
    id: true,
    created: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    name: z.string().min(1).max(256),
  });

/**
 * Schema for creating a new subscription
 */
export const createSubscriptionSchema = insertSubscriptionSchema.omit({
  id: true,
  created: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema for webhook payload validation (Stripe webhook events)
 */
export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  object: z.literal("event"),
  api_version: z.string().nullable(),
  created: z.number(),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
    previous_attributes: z.record(z.string(), z.unknown()).optional(),
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z
    .object({
      id: z.string().nullable(),
      idempotency_key: z.string().nullable(),
    })
    .nullable(),
  type: z.string(),
});

// ============================================================================
// TYPE EXPORTS (for TypeScript inference)
// Note: Prefixed with 'Validated' to avoid conflicts with Drizzle types
// ============================================================================

export type ValidatedInsertCustomer = z.infer<typeof insertCustomerSchema>;
export type ValidatedSelectCustomer = z.infer<typeof selectCustomerSchema>;
export type ValidatedCreateCustomer = z.infer<typeof createCustomerSchema>;

export type ValidatedInsertProduct = z.infer<typeof insertProductSchema>;
export type ValidatedSelectProduct = z.infer<typeof selectProductSchema>;
export type ValidatedCreateProduct = z.infer<typeof createProductSchema>;

export type ValidatedInsertPrice = z.infer<typeof insertPriceSchema>;
export type ValidatedSelectPrice = z.infer<typeof selectPriceSchema>;

export type ValidatedInsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type ValidatedSelectPaymentIntent = z.infer<typeof selectPaymentIntentSchema>;
export type ValidatedCreatePaymentIntent = z.infer<typeof createPaymentIntentSchema>;

export type ValidatedInsertCharge = z.infer<typeof insertChargeSchema>;
export type ValidatedSelectCharge = z.infer<typeof selectChargeSchema>;

export type ValidatedInsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type ValidatedSelectPaymentMethod = z.infer<typeof selectPaymentMethodSchema>;

export type ValidatedInsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type ValidatedSelectSubscription = z.infer<typeof selectSubscriptionSchema>;
export type ValidatedCreateSubscription = z.infer<typeof createSubscriptionSchema>;

export type ValidatedInsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type ValidatedSelectInvoice = z.infer<typeof selectInvoiceSchema>;

export type ValidatedInsertCheckoutSession = z.infer<typeof insertCheckoutSessionSchema>;
export type ValidatedSelectCheckoutSession = z.infer<typeof selectCheckoutSessionSchema>;

export type StripeWebhookEvent = z.infer<typeof stripeWebhookEventSchema>;
