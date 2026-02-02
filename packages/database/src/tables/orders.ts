import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orderStatusEnum } from "../enums";
import { promotionCodes } from "./promotion-codes";
import { users } from "./users";

type AddressSnapshot = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export const orders = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  guestEmail: text("guest_email"),
  status: orderStatusEnum("status").default("pending").notNull(),
  currency: text("currency").notNull().default("usd"),
  subtotalAmount: integer("subtotal_amount").notNull(),
  discountAmount: integer("discount_amount").default(0).notNull(),
  shippingAmount: integer("shipping_amount").default(0).notNull(),
  taxAmount: integer("tax_amount").default(0).notNull(),
  totalAmount: integer("total_amount").notNull(),
  shippingAddress: jsonb("shipping_address").$type<AddressSnapshot>(),
  billingAddress: jsonb("billing_address").$type<AddressSnapshot>(),
  promotionCodeId: text("promotion_code_id").references(() => promotionCodes.id, { onDelete: "set null" }),
  shippingRateId: text("shipping_rate_id"),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  paidAt: timestamp("paid_at", { mode: "date" }),
  shippedAt: timestamp("shipped_at", { mode: "date" }),
  deliveredAt: timestamp("delivered_at", { mode: "date" }),
  cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
