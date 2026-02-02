import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  checkoutSessionModeEnum,
  checkoutSessionPaymentStatusEnum,
  checkoutSessionStatusEnum,
  checkoutSessionUiModeEnum,
} from "../enums";
import { customers } from "./customers";
import { invoices } from "./invoices";
import { paymentIntents } from "./payment-intents";
import { setupIntents } from "./setup-intents";
import { subscriptions } from "./subscriptions";

export const checkoutSessions = pgTable("checkout_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique().notNull(),
  object: text("object").default("checkout.session"),
  clientReferenceId: text("client_reference_id"),
  currency: text("currency"),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerEmail: text("customer_email"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  mode: checkoutSessionModeEnum("mode").notNull(),
  paymentIntentId: text("payment_intent_id").references(() => paymentIntents.id, { onDelete: "set null" }),
  paymentStatus: checkoutSessionPaymentStatusEnum("payment_status").notNull(),
  status: checkoutSessionStatusEnum("status").notNull(),
  successUrl: text("success_url"),
  cancelUrl: text("cancel_url"),
  returnUrl: text("return_url"),
  uiMode: checkoutSessionUiModeEnum("ui_mode").default("hosted"),
  url: text("url"),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  setupIntentId: text("setup_intent_id").references(() => setupIntents.id, { onDelete: "set null" }),
  paymentLinkId: text("payment_link_id"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  automaticTax: jsonb("automatic_tax").$type<{
    enabled?: boolean;
    liability?: {
      type?: string;
      account?: string;
    };
    status?: string;
  }>(),
  lineItems: jsonb("line_items").$type<
    Array<{
      priceId?: string;
      quantity?: number;
      description?: string;
      amount?: number;
    }>
  >(),
  clientSecret: text("client_secret"),
  customerAccount: text("customer_account"),
  livemode: boolean("livemode").default(false).notNull(),
  paymentMethodTypes: text("payment_method_types").array(),
  shippingOptions: jsonb("shipping_options").$type<
    Array<{
      shippingRateId?: string;
      shippingAmount?: number;
    }>
  >(),
  // Adaptive Pricing & Amounts
  adaptivePricing: jsonb("adaptive_pricing").$type<{
    enabled?: boolean;
  }>(),
  afterExpiration: jsonb("after_expiration").$type<{
    recovery?: {
      allowPromotionCodes?: boolean;
      enabled?: boolean;
      expiresAt?: number;
      url?: string;
    };
  }>(),
  allowPromotionCodes: boolean("allow_promotion_codes"),
  amountSubtotal: integer("amount_subtotal"),
  amountTotal: integer("amount_total"),
  // Address & Collection
  billingAddressCollection: text("billing_address_collection"),
  brandingSettings: jsonb("branding_settings").$type<{
    backgroundColor?: string;
    button?: {
      theme?: string;
    };
    font?: string;
    logo?: string;
    primaryButtonColor?: string;
  }>(),
  collectedInformation: jsonb("collected_information").$type<{
    address?: string;
    email?: string;
    name?: string;
    phone?: string;
  }>(),
  consent: jsonb("consent").$type<{
    promotions?: string;
    termsOfService?: string;
  }>(),
  consentCollection: jsonb("consent_collection").$type<{
    paymentMethodReuseAgreement?: {
      position?: string;
    };
    promotions?: string;
    termsOfService?: string;
  }>(),
  // Configuration
  currencyConversion: jsonb("currency_conversion").$type<{
    amountSubtotal?: number;
    amountTotal?: number;
    fxRate?: string;
    sourceCurrency?: string;
  }>(),
  customFields: jsonb("custom_fields").$type<
    Array<{
      key?: string;
      label?: {
        custom?: string;
        type?: string;
      };
      optional?: boolean;
      type?: string;
    }>
  >(),
  customText: jsonb("custom_text").$type<{
    afterSubmit?: { message?: string };
    shippingAddress?: { message?: string };
    submit?: { message?: string };
    termsOfServiceAcceptance?: { message?: string };
  }>(),
  customerCreation: text("customer_creation"),
  customerDetails: jsonb("customer_details").$type<{
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    email?: string;
    name?: string;
    phone?: string;
    taxExempt?: string;
    taxIds?: Array<{
      type?: string;
      value?: string;
    }>;
  }>(),
  // Payment Configuration
  excludedPaymentMethodTypes: text("excluded_payment_method_types").array(),
  invoiceCreation: jsonb("invoice_creation").$type<{
    enabled?: boolean;
    invoiceData?: {
      accountTaxIds?: string[];
      customFields?: Array<{ name?: string; value?: string }>;
      description?: string;
      footer?: string;
      metadata?: Record<string, string>;
      renderingOptions?: {
        amountTaxDisplay?: string;
      };
    };
  }>(),
  locale: text("locale"),
  paymentMethodCollection: text("payment_method_collection"),
  paymentMethodConfigurationDetails: jsonb("payment_method_configuration_details").$type<{
    id?: string;
    parent?: string;
  }>(),
  paymentMethodOptions: jsonb("payment_method_options").$type<Record<string, unknown>>(),
  // Advanced Features
  nameCollection: jsonb("name_collection").$type<{
    enabled?: boolean;
  }>(),
  optionalItems: text("optional_items").array(),
  originContext: text("origin_context"),
  permissions: jsonb("permissions").$type<{
    readWrite?: string[];
  }>(),
  phoneNumberCollection: jsonb("phone_number_collection").$type<{
    enabled?: boolean;
  }>(),
  presentmentDetails: jsonb("presentment_details").$type<Record<string, unknown>>(),
  recoveredFrom: text("recovered_from"),
  redirectOnCompletion: text("redirect_on_completion"),
  savedPaymentMethodOptions: jsonb("saved_payment_method_options").$type<{
    allowRedisplayFilters?: string[];
    paymentMethodRemove?: string;
    paymentMethodSave?: string;
  }>(),
  shippingAddressCollection: jsonb("shipping_address_collection").$type<{
    allowedCountries?: string[];
  }>(),
  shippingCost: jsonb("shipping_cost").$type<{
    amountSubtotal?: number;
    amountTax?: number;
    amountTotal?: number;
    shippingRate?: string;
  }>(),
  submitType: text("submit_type"),
  taxIdCollection: jsonb("tax_id_collection").$type<{
    enabled?: boolean;
    required?: string;
  }>(),
  totalDetails: jsonb("total_details").$type<{
    amountDiscount?: number;
    amountShipping?: number;
    amountTax?: number;
    breakdown?: {
      discounts?: Array<{ amount?: number; discount?: string }>;
      taxes?: Array<{ amount?: number; rate?: string }>;
    };
  }>(),
  walletOptions: jsonb("wallet_options").$type<{
    applePay?: string;
    googlePay?: string;
  }>(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
