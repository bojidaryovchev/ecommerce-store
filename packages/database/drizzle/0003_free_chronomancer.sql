ALTER TYPE "public"."payment_method_type" ADD VALUE 'custom';--> statement-breakpoint
ALTER TABLE "balance_transaction" ALTER COLUMN "fee" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "amount_captured" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "amount_refunded" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "billing_details" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "billing_details" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "disputed" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "refunded" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "paid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "captured" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "charge" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon" ALTER COLUMN "percent_off" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "balance" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "invoice_settings" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "invoice_settings" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "evidence" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "evidence" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "balance_transactions" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "balance_transactions" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "evidence_details" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "evidence_details" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "is_charge_refundable" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "dispute" ALTER COLUMN "is_charge_refundable" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ALTER COLUMN "subtotal" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ALTER COLUMN "subtotal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_intent" ALTER COLUMN "amount_capturable" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_intent" ALTER COLUMN "amount_received" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_intent" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "payment_intent" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "price" ALTER COLUMN "billing_scheme" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "price" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "price" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "images" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "images" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "marketing_features" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "marketing_features" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "checkout_session" text;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "invoice" text;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "invoice_item" text;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "subscription_item" text;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "customer_account" text;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "source" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "livemode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD COLUMN "amount_excluding_tax" integer;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD COLUMN "unit_amount_excluding_tax" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "updated" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "promotion_code" ADD COLUMN "promotion" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_id" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tax_id" ADD COLUMN "owner" jsonb;--> statement-breakpoint
ALTER TABLE "tax_id" ADD COLUMN "verification" jsonb;--> statement-breakpoint
ALTER TABLE "tax_id" ADD COLUMN "livemode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id");