import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { paymentMethodTypeEnum } from "../enums";
import { customers } from "./customers";

export const paymentMethods = pgTable("payment_method", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripePaymentMethodId: text("stripe_payment_method_id").unique().notNull(),
  object: text("object").default("payment_method"),
  type: paymentMethodTypeEnum("type").notNull(),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  billingDetails: jsonb("billing_details").$type<{
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
  }>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  // Card-specific fields
  card: jsonb("card").$type<{
    brand?: string;
    country?: string;
    expMonth?: number;
    expYear?: number;
    fingerprint?: string;
    funding?: string;
    last4?: string;
    networks?: {
      available?: string[];
      preferred?: string;
    };
    threeDSecureUsage?: {
      supported?: boolean;
    };
    wallet?: {
      type?: string;
      applePay?: Record<string, unknown>;
      googlePay?: Record<string, unknown>;
    };
  }>(),
  // Bank account fields
  usBankAccount: jsonb("us_bank_account").$type<{
    accountHolderType?: string;
    accountType?: string;
    bankName?: string;
    fingerprint?: string;
    last4?: string;
    networks?: {
      preferred?: string;
      supported?: string[];
    };
    routingNumber?: string;
  }>(),
  sepaDebit: jsonb("sepa_debit").$type<{
    bankCode?: string;
    branchCode?: string;
    country?: string;
    fingerprint?: string;
    last4?: string;
  }>(),
  // Digital Wallets
  acssDebit: jsonb("acss_debit").$type<Record<string, unknown>>(),
  alipay: jsonb("alipay").$type<Record<string, unknown>>(),
  amazonPay: jsonb("amazon_pay").$type<Record<string, unknown>>(),
  cashapp: jsonb("cashapp").$type<Record<string, unknown>>(),
  grabpay: jsonb("grabpay").$type<Record<string, unknown>>(),
  kakaoPay: jsonb("kakao_pay").$type<Record<string, unknown>>(),
  link: jsonb("link").$type<Record<string, unknown>>(),
  mobilepay: jsonb("mobilepay").$type<Record<string, unknown>>(),
  naverPay: jsonb("naver_pay").$type<Record<string, unknown>>(),
  payco: jsonb("payco").$type<Record<string, unknown>>(),
  paypal: jsonb("paypal").$type<Record<string, unknown>>(),
  paypay: jsonb("paypay").$type<Record<string, unknown>>(),
  revolutPay: jsonb("revolut_pay").$type<Record<string, unknown>>(),
  samsungPay: jsonb("samsung_pay").$type<Record<string, unknown>>(),
  wechatPay: jsonb("wechat_pay").$type<Record<string, unknown>>(),
  // Buy Now, Pay Later
  affirm: jsonb("affirm").$type<Record<string, unknown>>(),
  afterpayClearpay: jsonb("afterpay_clearpay").$type<Record<string, unknown>>(),
  alma: jsonb("alma").$type<Record<string, unknown>>(),
  billie: jsonb("billie").$type<Record<string, unknown>>(),
  klarna: jsonb("klarna").$type<Record<string, unknown>>(),
  zip: jsonb("zip").$type<Record<string, unknown>>(),
  // Bank Transfers & Direct Debit
  auBecsDebit: jsonb("au_becs_debit").$type<Record<string, unknown>>(),
  bacsDebit: jsonb("bacs_debit").$type<Record<string, unknown>>(),
  payByBank: jsonb("pay_by_bank").$type<Record<string, unknown>>(),
  payto: jsonb("payto").$type<Record<string, unknown>>(),
  nzBankAccount: jsonb("nz_bank_account").$type<Record<string, unknown>>(),
  // Regional Methods
  bancontact: jsonb("bancontact").$type<Record<string, unknown>>(),
  blik: jsonb("blik").$type<Record<string, unknown>>(),
  boleto: jsonb("boleto").$type<Record<string, unknown>>(),
  eps: jsonb("eps").$type<Record<string, unknown>>(),
  fpx: jsonb("fpx").$type<Record<string, unknown>>(),
  giropay: jsonb("giropay").$type<Record<string, unknown>>(),
  ideal: jsonb("ideal").$type<Record<string, unknown>>(),
  konbini: jsonb("konbini").$type<Record<string, unknown>>(),
  krCard: jsonb("kr_card").$type<Record<string, unknown>>(),
  mbWay: jsonb("mb_way").$type<Record<string, unknown>>(),
  multibanco: jsonb("multibanco").$type<Record<string, unknown>>(),
  oxxo: jsonb("oxxo").$type<Record<string, unknown>>(),
  p24: jsonb("p24").$type<Record<string, unknown>>(),
  paynow: jsonb("paynow").$type<Record<string, unknown>>(),
  pix: jsonb("pix").$type<Record<string, unknown>>(),
  promptpay: jsonb("promptpay").$type<Record<string, unknown>>(),
  satispay: jsonb("satispay").$type<Record<string, unknown>>(),
  sofort: jsonb("sofort").$type<Record<string, unknown>>(),
  swish: jsonb("swish").$type<Record<string, unknown>>(),
  twint: jsonb("twint").$type<Record<string, unknown>>(),
  // In-person & Special
  cardPresent: jsonb("card_present").$type<Record<string, unknown>>(),
  interacPresent: jsonb("interac_present").$type<Record<string, unknown>>(),
  crypto: jsonb("crypto").$type<Record<string, unknown>>(),
  customerBalance: jsonb("customer_balance").$type<Record<string, unknown>>(),
  custom: jsonb("custom").$type<Record<string, unknown>>(),
  // Additional
  radarOptions: jsonb("radar_options").$type<{
    session?: string;
  }>(),
  // Generic catch-all for any future payment types
  paymentMethodData: jsonb("payment_method_data").$type<Record<string, unknown>>(),
  allowRedisplay: text("allow_redisplay"),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
