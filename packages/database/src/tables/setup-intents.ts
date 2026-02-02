import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { setupIntentStatusEnum, setupIntentUsageEnum } from "../enums";
import { customers } from "./customers";

export const setupIntents = pgTable("setup_intent", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeSetupIntentId: text("stripe_setup_intent_id").unique().notNull(),
  object: text("object").default("setup_intent"),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  status: setupIntentStatusEnum("status").notNull(),
  usage: setupIntentUsageEnum("usage").notNull(),
  clientSecret: text("client_secret"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  paymentMethodId: text("payment_method_id"),
  paymentMethodTypes: text("payment_method_types").array().notNull(),
  automaticPaymentMethods: jsonb("automatic_payment_methods").$type<{
    allowRedirects?: string;
    enabled?: boolean;
  }>(),
  application: text("application"),
  cancellationReason: text("cancellation_reason").$type<"abandoned" | "duplicate" | "requested_by_customer">(),
  lastSetupError: jsonb("last_setup_error").$type<{
    charge?: string;
    code?: string;
    declineCode?: string;
    docUrl?: string;
    message?: string;
    param?: string;
    paymentMethod?: {
      id?: string;
      type?: string;
    };
    type?: string;
  }>(),
  latestAttemptId: text("latest_attempt_id"),
  mandateId: text("mandate_id"),
  nextAction: jsonb("next_action").$type<{
    type?: string;
    redirectToUrl?: {
      returnUrl?: string;
      url?: string;
    };
    useStripeSdk?: Record<string, unknown>;
    verifyWithMicrodeposits?: {
      arrivalDate?: number;
      hostedVerificationUrl?: string;
      microdepositType?: string;
    };
  }>(),
  onBehalfOf: text("on_behalf_of"),
  paymentMethodConfigurationDetails: jsonb("payment_method_configuration_details").$type<{
    id?: string;
    parent?: string;
  }>(),
  paymentMethodOptions: jsonb("payment_method_options").$type<Record<string, unknown>>(),
  singleUseMandate: text("single_use_mandate"),
  customerAccount: text("customer_account"),
  flowDirections: text("flow_directions").array(),
  attachToSelf: boolean("attach_to_self").default(false),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
