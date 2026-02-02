import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { disputeReasonEnum, disputeStatusEnum } from "../enums";
import { charges } from "./charges";
import { paymentIntents } from "./payment-intents";

export const disputes = pgTable("dispute", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeDisputeId: text("stripe_dispute_id").unique().notNull(),
  object: text("object").default("dispute"),
  amount: integer("amount").notNull(),
  chargeId: text("charge_id")
    .notNull()
    .references(() => charges.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  enhancedEligibilityTypes: text("enhanced_eligibility_types").array().notNull(),
  evidence: jsonb("evidence").$type<{
    accessActivityLog?: string;
    billingAddress?: string;
    cancellationPolicy?: string;
    cancellationPolicyDisclosure?: string;
    cancellationRebuttal?: string;
    customerCommunication?: string;
    customerEmailAddress?: string;
    customerName?: string;
    customerPurchaseIp?: string;
    customerSignature?: string;
    duplicateChargeDocumentation?: string;
    duplicateChargeExplanation?: string;
    duplicateChargeId?: string;
    productDescription?: string;
    receipt?: string;
    refundPolicy?: string;
    refundPolicyDisclosure?: string;
    refundRefusalExplanation?: string;
    serviceDate?: string;
    serviceDocumentation?: string;
    shippingAddress?: string;
    shippingCarrier?: string;
    shippingDate?: string;
    shippingDocumentation?: string;
    shippingTrackingNumber?: string;
    uncategorizedFile?: string;
    uncategorizedText?: string;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  paymentIntentId: text("payment_intent_id").references(() => paymentIntents.id, { onDelete: "set null" }),
  reason: disputeReasonEnum("reason").notNull(),
  status: disputeStatusEnum("status").notNull(),
  balanceTransactions: text("balance_transactions").array(),
  evidenceDetails: jsonb("evidence_details").$type<{
    dueBy?: number;
    hasEvidence?: boolean;
    pastDue?: boolean;
    submissionCount?: number;
  }>(),
  isChargeRefundable: boolean("is_charge_refundable"),
  paymentMethodDetails: jsonb("payment_method_details").$type<{
    card?: {
      brand?: string;
      networkReasonCode?: string;
    };
    type?: string;
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
