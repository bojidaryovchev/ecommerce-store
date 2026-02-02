import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  paymentLinkBillingAddressCollectionEnum,
  paymentLinkCustomerCreationEnum,
  paymentLinkPaymentMethodCollectionEnum,
  paymentLinkSubmitTypeEnum,
} from "../enums";

export const paymentLinks = pgTable("payment_link", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripePaymentLinkId: text("stripe_payment_link_id").unique().notNull(),
  object: text("object").default("payment_link"),
  active: boolean("active").default(true).notNull(),
  afterCompletion: jsonb("after_completion").$type<{
    type?: "hosted_confirmation" | "redirect";
    hostedConfirmation?: {
      customMessage?: string;
    };
    redirect?: {
      url?: string;
    };
  }>(),
  allowPromotionCodes: boolean("allow_promotion_codes").default(false),
  application: text("application"),
  applicationFeeAmount: integer("application_fee_amount"),
  applicationFeePercent: text("application_fee_percent"),
  automaticTax: jsonb("automatic_tax").$type<{
    enabled?: boolean;
    liability?: {
      type?: string;
      account?: string;
    };
  }>(),
  billingAddressCollection: paymentLinkBillingAddressCollectionEnum("billing_address_collection").default("auto"),
  consentCollection: jsonb("consent_collection").$type<{
    paymentMethodReuseAgreement?: {
      position?: "auto" | "hidden";
    };
    promotions?: "auto" | "none";
    termsOfService?: "none" | "required";
  }>(),
  currency: text("currency").notNull(),
  customFields: jsonb("custom_fields").$type<
    Array<{
      key?: string;
      label?: {
        custom?: string;
        type?: "custom";
      };
      optional?: boolean;
      type?: "dropdown" | "numeric" | "text";
      dropdown?: {
        options?: Array<{
          label?: string;
          value?: string;
        }>;
      };
      numeric?: {
        maximumLength?: number;
        minimumLength?: number;
      };
      text?: {
        maximumLength?: number;
        minimumLength?: number;
      };
    }>
  >(),
  customText: jsonb("custom_text").$type<{
    afterSubmit?: {
      message?: string;
    };
    shippingAddress?: {
      message?: string;
    };
    submit?: {
      message?: string;
    };
    termsOfServiceAcceptance?: {
      message?: string;
    };
  }>(),
  customerCreation: paymentLinkCustomerCreationEnum("customer_creation").default("if_required"),
  inactiveMessage: text("inactive_message"),
  invoiceCreation: jsonb("invoice_creation").$type<{
    enabled?: boolean;
    invoiceData?: {
      accountTaxIds?: string[];
      customFields?: Array<{
        name?: string;
        value?: string;
      }>;
      description?: string;
      footer?: string;
      issuer?: {
        account?: string;
        type?: "account" | "self";
      };
      metadata?: Record<string, string>;
      renderingOptions?: {
        amountTaxDisplay?: "exclude_tax" | "include_inclusive_tax";
      };
    };
  }>(),
  lineItems: jsonb("line_items").$type<{
    data?: Array<{
      id?: string;
      price?: {
        id?: string;
        product?: string;
      };
      quantity?: number;
      adjustableQuantity?: {
        enabled?: boolean;
        maximum?: number;
        minimum?: number;
      };
    }>;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  onBehalfOf: text("on_behalf_of"),
  paymentIntentData: jsonb("payment_intent_data").$type<{
    captureMethod?: "automatic" | "automatic_async" | "manual";
    description?: string;
    metadata?: Record<string, string>;
    setupFutureUsage?: "off_session" | "on_session";
    statementDescriptor?: string;
    statementDescriptorSuffix?: string;
    transferGroup?: string;
  }>(),
  paymentMethodCollection: paymentLinkPaymentMethodCollectionEnum("payment_method_collection").default("always"),
  paymentMethodTypes: text("payment_method_types").array(),
  phoneNumberCollection: jsonb("phone_number_collection").$type<{
    enabled?: boolean;
  }>(),
  restrictions: jsonb("restrictions").$type<{
    completedSessions?: {
      count?: number;
      limit?: number;
    };
  }>(),
  shippingAddressCollection: jsonb("shipping_address_collection").$type<{
    allowedCountries?: string[];
  }>(),
  shippingOptions: jsonb("shipping_options").$type<
    Array<{
      shippingRateId?: string;
      shippingAmount?: number;
    }>
  >(),
  submitType: paymentLinkSubmitTypeEnum("submit_type").default("auto"),
  subscriptionData: jsonb("subscription_data").$type<{
    description?: string;
    invoiceSettings?: {
      issuer?: {
        account?: string;
        type?: "account" | "self";
      };
    };
    metadata?: Record<string, string>;
    trialPeriodDays?: number;
    trialSettings?: {
      endBehavior?: {
        missingPaymentMethod?: "cancel" | "create_invoice" | "pause";
      };
    };
  }>(),
  taxIdCollection: jsonb("tax_id_collection").$type<{
    enabled?: boolean;
    required?: "if_supported" | "never";
  }>(),
  transferData: jsonb("transfer_data").$type<{
    amount?: number;
    destination?: string;
  }>(),
  url: text("url"),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
