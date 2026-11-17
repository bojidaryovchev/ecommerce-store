CREATE TYPE "public"."dispute_intended_submission_method" AS ENUM('manual', 'prefer_manual', 'prefer_smart_disputes', 'smart_disputes');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('good', 'service');--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'fee_credit_funding';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'inbound_transfer';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'inbound_transfer_reversal';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'issuing_dispute_provisional_credit';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'issuing_dispute_provisional_credit_reversal';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'payout_minimum_balance_hold';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'payout_minimum_balance_release';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'reserve_hold';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'reserve_release';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'stripe_balance_payment_debit';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'stripe_balance_payment_debit_reversal';--> statement-breakpoint
ALTER TYPE "public"."balance_transaction_type" ADD VALUE 'tax_fund';--> statement-breakpoint
ALTER TYPE "public"."credit_note_type" ADD VALUE 'mixed';--> statement-breakpoint
ALTER TYPE "public"."dispute_status" ADD VALUE 'appeal_needs_response';--> statement-breakpoint
ALTER TYPE "public"."dispute_status" ADD VALUE 'appeal_under_review';--> statement-breakpoint
ALTER TYPE "public"."payment_link_submit_type" ADD VALUE 'subscribe';--> statement-breakpoint
ALTER TYPE "public"."payment_method_type" ADD VALUE 'bizum';--> statement-breakpoint
ALTER TYPE "public"."payment_method_type" ADD VALUE 'scalapay';--> statement-breakpoint
ALTER TYPE "public"."payment_method_type" ADD VALUE 'sequra';--> statement-breakpoint
ALTER TYPE "public"."payment_method_type" ADD VALUE 'sunbit';--> statement-breakpoint
ALTER TYPE "public"."payment_method_type" ADD VALUE 'upi';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'al_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'am_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'ao_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'au_acn';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'au_wpn';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'aw_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'az_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'ba_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'bb_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'bd_bin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'bf_ifu';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'bj_ifu';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'bs_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'bw_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'by_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'cd_nif';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'ch_uid';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'ci_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'cm_niu';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'cv_nif';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'cz_dic';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'de_stn';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'et_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'fo_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'fr_siren';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'fr_siret';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'fr_spi';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'gh_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'gi_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'gn_nif';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'hr_oib';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'ic_nif';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'is_kt';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'it_cf';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'kg_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'kh_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'la_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'li_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'lk_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'ma_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'md_cf';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'md_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'me_pib';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'mk_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'mr_nif';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'mu_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'mz_nuit';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'np_pan';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'nz_bn';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'pl_nip';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'pt_nif';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'py_ruc';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'sm_coe';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'sn_ninea';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'sr_fin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'tj_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'tt_bir';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'tt_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'tz_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'ug_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'uz_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'uz_vat';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'zm_tin';--> statement-breakpoint
ALTER TYPE "public"."tax_id_type" ADD VALUE 'zw_tin';--> statement-breakpoint
ALTER TABLE "credit_note" DROP CONSTRAINT "credit_note_refund_id_refund_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice_item" DROP CONSTRAINT "invoice_item_price_id_price_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP CONSTRAINT "invoice_line_item_subscription_item_id_subscription_item_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_payment_intent_id_payment_intent_id_fk";
--> statement-breakpoint
-- Stripe API 2026-03-25.dahlia renamed the Checkout Session ui_mode values. Rename in place (hand-edited;
-- drizzle-kit would drop/recreate the type and fail to cast existing rows).
ALTER TYPE "public"."checkout_session_ui_mode" RENAME VALUE 'hosted' TO 'hosted_page';--> statement-breakpoint
ALTER TYPE "public"."checkout_session_ui_mode" RENAME VALUE 'embedded' TO 'embedded_page';--> statement-breakpoint
ALTER TYPE "public"."checkout_session_ui_mode" RENAME VALUE 'custom' TO 'elements';--> statement-breakpoint
ALTER TYPE "public"."checkout_session_ui_mode" ADD VALUE 'form';--> statement-breakpoint
ALTER TABLE "checkout_session" ALTER COLUMN "ui_mode" SET DEFAULT 'hosted_page';--> statement-breakpoint
ALTER TABLE "charge" ADD COLUMN "authorization_code" text;--> statement-breakpoint
ALTER TABLE "charge" ADD COLUMN "level3" jsonb;--> statement-breakpoint
ALTER TABLE "charge" ADD COLUMN "source" jsonb;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD COLUMN "allowed_payment_method_types" text[];--> statement-breakpoint
ALTER TABLE "checkout_session" ADD COLUMN "discounts" jsonb;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD COLUMN "integration_identifier" text;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD COLUMN "managed_payments" jsonb;--> statement-breakpoint
ALTER TABLE "credit_note" ADD COLUMN "customer_account" text;--> statement-breakpoint
ALTER TABLE "credit_note" ADD COLUMN "post_payment_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_note" ADD COLUMN "pre_payment_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_note" ADD COLUMN "pretax_credit_amounts" jsonb;--> statement-breakpoint
ALTER TABLE "credit_note" ADD COLUMN "refunds" jsonb;--> statement-breakpoint
ALTER TABLE "credit_note" ADD COLUMN "total_taxes" jsonb;--> statement-breakpoint
ALTER TABLE "dispute" ADD COLUMN "intended_submission_method" "dispute_intended_submission_method";--> statement-breakpoint
ALTER TABLE "dispute" ADD COLUMN "network_reason_code" text;--> statement-breakpoint
ALTER TABLE "invoice_item" ADD COLUMN "frozen_fields" text[];--> statement-breakpoint
ALTER TABLE "invoice_item" ADD COLUMN "invoicing_rules" jsonb;--> statement-breakpoint
ALTER TABLE "invoice_item" ADD COLUMN "quantity_decimal" text;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD COLUMN "quantity_decimal" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "amount_paid_off_stripe" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "default_tax_rates" jsonb;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "status_details" jsonb;--> statement-breakpoint
ALTER TABLE "payment_intent" ADD COLUMN "allowed_payment_method_types" text[];--> statement-breakpoint
ALTER TABLE "payment_intent" ADD COLUMN "managed_payments" jsonb;--> statement-breakpoint
ALTER TABLE "payment_intent" ADD COLUMN "payment_record_id" text;--> statement-breakpoint
ALTER TABLE "payment_intent" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "payment_link" ADD COLUMN "managed_payments" jsonb;--> statement-breakpoint
ALTER TABLE "payment_link" ADD COLUMN "name_collection" jsonb;--> statement-breakpoint
ALTER TABLE "payment_link" ADD COLUMN "optional_items" jsonb;--> statement-breakpoint
ALTER TABLE "payment_link" ADD COLUMN "payment_method_options" jsonb;--> statement-breakpoint
ALTER TABLE "payment_method" ADD COLUMN "customer_account" text;--> statement-breakpoint
ALTER TABLE "payment_method" ADD COLUMN "bizum" jsonb;--> statement-breakpoint
ALTER TABLE "payment_method" ADD COLUMN "scalapay" jsonb;--> statement-breakpoint
ALTER TABLE "payment_method" ADD COLUMN "sequra" jsonb;--> statement-breakpoint
ALTER TABLE "payment_method" ADD COLUMN "sunbit" jsonb;--> statement-breakpoint
ALTER TABLE "payment_method" ADD COLUMN "upi" jsonb;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "tax_details" jsonb;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "type" "product_type" DEFAULT 'service' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "computed" jsonb;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "customer_account" text;--> statement-breakpoint
ALTER TABLE "refund" ADD COLUMN "customer_id" text;--> statement-breakpoint
ALTER TABLE "refund" ADD COLUMN "customer_account" text;--> statement-breakpoint
ALTER TABLE "refund" ADD COLUMN "payment_method_id" text;--> statement-breakpoint
ALTER TABLE "refund" ADD COLUMN "presentment_details" jsonb;--> statement-breakpoint
ALTER TABLE "setup_intent" ADD COLUMN "allowed_payment_method_types" text[];--> statement-breakpoint
ALTER TABLE "setup_intent" ADD COLUMN "excluded_payment_method_types" text[];--> statement-breakpoint
ALTER TABLE "setup_intent" ADD COLUMN "managed_payments" jsonb;--> statement-breakpoint
ALTER TABLE "subscription_item" ADD COLUMN "billed_until" timestamp;--> statement-breakpoint
ALTER TABLE "subscription_item" ADD COLUMN "current_trial" jsonb;--> statement-breakpoint
ALTER TABLE "subscription_item" ADD COLUMN "plan" jsonb;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "billing_schedules" jsonb;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "managed_payments" jsonb;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "status_details" jsonb;--> statement-breakpoint
ALTER TABLE "tax_id" ADD COLUMN "customer_account" text;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_method_id_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_method"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_transaction" DROP COLUMN "livemode";--> statement-breakpoint
ALTER TABLE "credit_note" DROP COLUMN "refund_id";--> statement-breakpoint
ALTER TABLE "credit_note" DROP COLUMN "tax_amounts";--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "application";--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "application_fee_percent";--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "on_behalf_of";--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "account_country";--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "account_name";--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "default_tax_rates";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "livemode";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "created";--> statement-breakpoint
ALTER TABLE "invoice_item" DROP COLUMN "price_id";--> statement-breakpoint
ALTER TABLE "invoice_item" DROP COLUMN "created";--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP COLUMN "subscription_item_id";--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP COLUMN "proration";--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP COLUMN "tax_rates";--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP COLUMN "amount_excluding_tax";--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP COLUMN "unit_amount_excluding_tax";--> statement-breakpoint
ALTER TABLE "invoice_line_item" DROP COLUMN "created";--> statement-breakpoint
ALTER TABLE "invoice" DROP COLUMN "payment_intent_id";--> statement-breakpoint
ALTER TABLE "payment_intent" DROP COLUMN "invoice_id";--> statement-breakpoint
ALTER TABLE "payment_link" DROP COLUMN "created";--> statement-breakpoint
ALTER TABLE "payment_method" DROP COLUMN "payment_method_data";--> statement-breakpoint
ALTER TABLE "quote" DROP COLUMN "computed_upfront_total";--> statement-breakpoint
ALTER TABLE "quote" DROP COLUMN "computed_recurring_total";--> statement-breakpoint
ALTER TABLE "refund" DROP COLUMN "livemode";--> statement-breakpoint
ALTER TABLE "setup_intent" DROP COLUMN "hooks";--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "current_period_start";--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "current_period_end";--> statement-breakpoint
ALTER TABLE "tax_id" DROP COLUMN "description";--> statement-breakpoint
DROP TYPE "public"."invoice_line_item_type";