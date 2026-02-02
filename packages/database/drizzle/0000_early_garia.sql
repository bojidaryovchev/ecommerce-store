CREATE TYPE "public"."address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
CREATE TYPE "public"."balance_transaction_type" AS ENUM('adjustment', 'advance', 'advance_funding', 'anticipation_repayment', 'application_fee', 'application_fee_refund', 'charge', 'climate_order_purchase', 'climate_order_refund', 'connect_collection_transfer', 'contribution', 'issuing_authorization_hold', 'issuing_authorization_release', 'issuing_dispute', 'issuing_transaction', 'obligation_outbound', 'obligation_reversal_inbound', 'payment', 'payment_failure_refund', 'payment_network_reserve_hold', 'payment_network_reserve_release', 'payment_refund', 'payment_reversal', 'payment_unreconciled', 'payout', 'payout_cancel', 'payout_failure', 'refund', 'refund_failure', 'reserve_transaction', 'reserved_funds', 'stripe_fee', 'stripe_fx_fee', 'tax_fee', 'topup', 'topup_reversal', 'transfer', 'transfer_cancel', 'transfer_failure', 'transfer_refund');--> statement-breakpoint
CREATE TYPE "public"."charge_status" AS ENUM('succeeded', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."checkout_session_mode" AS ENUM('payment', 'setup', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."checkout_session_payment_status" AS ENUM('paid', 'unpaid', 'no_payment_required');--> statement-breakpoint
CREATE TYPE "public"."checkout_session_status" AS ENUM('open', 'complete', 'expired');--> statement-breakpoint
CREATE TYPE "public"."checkout_session_ui_mode" AS ENUM('hosted', 'embedded', 'custom');--> statement-breakpoint
CREATE TYPE "public"."coupon_duration" AS ENUM('forever', 'once', 'repeating');--> statement-breakpoint
CREATE TYPE "public"."credit_note_reason" AS ENUM('duplicate', 'fraudulent', 'order_change', 'product_unsatisfactory');--> statement-breakpoint
CREATE TYPE "public"."credit_note_status" AS ENUM('issued', 'void');--> statement-breakpoint
CREATE TYPE "public"."credit_note_type" AS ENUM('pre_payment', 'post_payment');--> statement-breakpoint
CREATE TYPE "public"."customer_tax_exempt" AS ENUM('none', 'exempt', 'reverse');--> statement-breakpoint
CREATE TYPE "public"."dispute_reason" AS ENUM('bank_cannot_process', 'check_returned', 'credit_not_processed', 'customer_initiated', 'debit_not_authorized', 'duplicate', 'fraudulent', 'general', 'incorrect_account_details', 'insufficient_funds', 'noncompliant', 'product_not_received', 'product_unacceptable', 'subscription_canceled', 'unrecognized');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('lost', 'needs_response', 'prevented', 'under_review', 'warning_closed', 'warning_needs_response', 'warning_under_review', 'won');--> statement-breakpoint
CREATE TYPE "public"."invoice_billing_reason" AS ENUM('automatic_pending_invoice_item_invoice', 'manual', 'quote_accept', 'subscription', 'subscription_create', 'subscription_cycle', 'subscription_threshold', 'subscription_update', 'upcoming');--> statement-breakpoint
CREATE TYPE "public"."invoice_line_item_type" AS ENUM('invoiceitem', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'paid', 'uncollectible', 'void');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_capture_method" AS ENUM('automatic', 'automatic_async', 'manual');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_confirmation_method" AS ENUM('automatic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_setup_future_usage" AS ENUM('on_session', 'off_session');--> statement-breakpoint
CREATE TYPE "public"."payment_intent_status" AS ENUM('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded');--> statement-breakpoint
CREATE TYPE "public"."payment_link_billing_address_collection" AS ENUM('auto', 'required');--> statement-breakpoint
CREATE TYPE "public"."payment_link_customer_creation" AS ENUM('always', 'if_required');--> statement-breakpoint
CREATE TYPE "public"."payment_link_payment_method_collection" AS ENUM('always', 'if_required');--> statement-breakpoint
CREATE TYPE "public"."payment_link_submit_type" AS ENUM('auto', 'book', 'donate', 'pay');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('card', 'acss_debit', 'affirm', 'afterpay_clearpay', 'alipay', 'alma', 'amazon_pay', 'au_becs_debit', 'bacs_debit', 'bancontact', 'billie', 'blik', 'boleto', 'card_present', 'cashapp', 'crypto', 'customer_balance', 'eps', 'fpx', 'giropay', 'grabpay', 'ideal', 'interac_present', 'kakao_pay', 'klarna', 'konbini', 'kr_card', 'link', 'mb_way', 'mobilepay', 'multibanco', 'naver_pay', 'nz_bank_account', 'oxxo', 'p24', 'pay_by_bank', 'payco', 'paynow', 'paypal', 'paypay', 'payto', 'pix', 'promptpay', 'revolut_pay', 'samsung_pay', 'satispay', 'sepa_debit', 'sofort', 'swish', 'twint', 'us_bank_account', 'wechat_pay', 'zip');--> statement-breakpoint
CREATE TYPE "public"."price_billing_scheme" AS ENUM('per_unit', 'tiered');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('one_time', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."quote_collection_method" AS ENUM('charge_automatically', 'send_invoice');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'open', 'accepted', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."refund_reason" AS ENUM('duplicate', 'fraudulent', 'requested_by_customer', 'expired_uncaptured_charge');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'requires_action', 'succeeded', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."setup_intent_status" AS ENUM('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'canceled', 'succeeded');--> statement-breakpoint
CREATE TYPE "public"."setup_intent_usage" AS ENUM('off_session', 'on_session');--> statement-breakpoint
CREATE TYPE "public"."subscription_collection_method" AS ENUM('charge_automatically', 'send_invoice');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');--> statement-breakpoint
CREATE TYPE "public"."tax_behavior" AS ENUM('inclusive', 'exclusive', 'unspecified');--> statement-breakpoint
CREATE TYPE "public"."tax_id_type" AS ENUM('ad_nrt', 'ae_trn', 'ar_cuit', 'au_abn', 'au_arn', 'bg_uic', 'bh_vat', 'bo_tin', 'br_cnpj', 'br_cpf', 'ca_bn', 'ca_gst_hst', 'ca_pst_bc', 'ca_pst_mb', 'ca_pst_sk', 'ca_qst', 'ch_vat', 'cl_tin', 'cn_tin', 'co_nit', 'cr_tin', 'do_rcn', 'ec_ruc', 'eg_tin', 'es_cif', 'eu_oss_vat', 'eu_vat', 'gb_vat', 'ge_vat', 'hk_br', 'hu_tin', 'id_npwp', 'il_vat', 'in_gst', 'is_vat', 'jp_cn', 'jp_rn', 'jp_trn', 'ke_pin', 'kr_brn', 'kz_bin', 'li_uid', 'mx_rfc', 'my_frp', 'my_itn', 'my_sst', 'ng_tin', 'no_vat', 'no_voec', 'nz_gst', 'om_vat', 'pe_ruc', 'ph_tin', 'ro_tin', 'rs_pib', 'ru_inn', 'ru_kpp', 'sa_vat', 'sg_gst', 'sg_uen', 'si_tin', 'sv_nit', 'th_vat', 'tr_tin', 'tw_vat', 'ua_vat', 'us_ein', 'uy_ruc', 've_rif', 'vn_tin', 'za_vat');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "address_type" DEFAULT 'shipping' NOT NULL,
	"name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "balance_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_balance_transaction_id" text NOT NULL,
	"object" text DEFAULT 'balance_transaction',
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"fee" integer DEFAULT 0,
	"fee_details" jsonb,
	"net" integer NOT NULL,
	"source_id" text,
	"status" text,
	"type" "balance_transaction_type" NOT NULL,
	"available_on" timestamp,
	"balance_type" text,
	"exchange_rate" numeric(20, 10),
	"livemode" boolean DEFAULT false NOT NULL,
	"reporting_category" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balance_transaction_stripe_balance_transaction_id_unique" UNIQUE("stripe_balance_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "cart_item" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"product_id" text NOT NULL,
	"price_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image" text,
	"parent_id" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "charge" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_charge_id" text NOT NULL,
	"object" text DEFAULT 'charge',
	"amount" integer NOT NULL,
	"amount_captured" integer DEFAULT 0,
	"amount_refunded" integer DEFAULT 0,
	"billing_details" jsonb,
	"currency" text NOT NULL,
	"customer_id" text,
	"description" text,
	"disputed" boolean DEFAULT false,
	"payment_intent_id" text,
	"payment_method_details" jsonb,
	"receipt_email" text,
	"refunded" boolean DEFAULT false,
	"shipping" jsonb,
	"statement_descriptor" text,
	"statement_descriptor_suffix" text,
	"status" charge_status NOT NULL,
	"paid" boolean DEFAULT false,
	"balance_transaction_id" text,
	"captured" boolean DEFAULT false,
	"failure_code" text,
	"failure_message" text,
	"outcome" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"receipt_url" text,
	"receipt_number" text,
	"calculated_statement_descriptor" text,
	"failure_balance_transaction_id" text,
	"fraud_details" jsonb,
	"payment_method" text,
	"metadata" jsonb,
	"refunds" jsonb,
	"presentment_details" jsonb,
	"radar_options" jsonb,
	"application" text,
	"application_fee" text,
	"application_fee_amount" integer,
	"on_behalf_of" text,
	"source_transfer" text,
	"transfer" text,
	"transfer_data" jsonb,
	"transfer_group" text,
	"review" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "charge_stripe_charge_id_unique" UNIQUE("stripe_charge_id")
);
--> statement-breakpoint
CREATE TABLE "checkout_session" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_checkout_session_id" text NOT NULL,
	"object" text DEFAULT 'checkout.session',
	"client_reference_id" text,
	"currency" text,
	"customer_id" text,
	"customer_email" text,
	"metadata" jsonb,
	"mode" "checkout_session_mode" NOT NULL,
	"payment_intent_id" text,
	"payment_status" "checkout_session_payment_status" NOT NULL,
	"status" "checkout_session_status" NOT NULL,
	"success_url" text,
	"cancel_url" text,
	"return_url" text,
	"ui_mode" "checkout_session_ui_mode" DEFAULT 'hosted',
	"url" text,
	"subscription_id" text,
	"invoice_id" text,
	"setup_intent_id" text,
	"payment_link_id" text,
	"expires_at" timestamp,
	"automatic_tax" jsonb,
	"line_items" jsonb,
	"client_secret" text,
	"customer_account" text,
	"livemode" boolean DEFAULT false NOT NULL,
	"payment_method_types" text[],
	"shipping_options" jsonb,
	"adaptive_pricing" jsonb,
	"after_expiration" jsonb,
	"allow_promotion_codes" boolean,
	"amount_subtotal" integer,
	"amount_total" integer,
	"billing_address_collection" text,
	"branding_settings" jsonb,
	"collected_information" jsonb,
	"consent" jsonb,
	"consent_collection" jsonb,
	"currency_conversion" jsonb,
	"custom_fields" jsonb,
	"custom_text" jsonb,
	"customer_creation" text,
	"customer_details" jsonb,
	"excluded_payment_method_types" text[],
	"invoice_creation" jsonb,
	"locale" text,
	"payment_method_collection" text,
	"payment_method_configuration_details" jsonb,
	"payment_method_options" jsonb,
	"name_collection" jsonb,
	"optional_items" text[],
	"origin_context" text,
	"permissions" jsonb,
	"phone_number_collection" jsonb,
	"presentment_details" jsonb,
	"recovered_from" text,
	"redirect_on_completion" text,
	"saved_payment_method_options" jsonb,
	"shipping_address_collection" jsonb,
	"shipping_cost" jsonb,
	"submit_type" text,
	"tax_id_collection" jsonb,
	"total_details" jsonb,
	"wallet_options" jsonb,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_session_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_coupon_id" text,
	"object" text DEFAULT 'coupon',
	"percent_off" integer,
	"amount_off" integer,
	"currency" text,
	"duration" "coupon_duration" NOT NULL,
	"duration_in_months" integer,
	"max_redemptions" integer,
	"times_redeemed" integer DEFAULT 0 NOT NULL,
	"redeem_by" timestamp,
	"applies_to" jsonb,
	"valid" boolean DEFAULT true NOT NULL,
	"name" text,
	"metadata" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"currency_options" jsonb,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_stripe_coupon_id_unique" UNIQUE("stripe_coupon_id")
);
--> statement-breakpoint
CREATE TABLE "credit_note" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_credit_note_id" text NOT NULL,
	"object" text DEFAULT 'credit_note',
	"customer_id" text,
	"invoice_id" text NOT NULL,
	"refund_id" text,
	"amount" integer NOT NULL,
	"amount_shipping" integer DEFAULT 0,
	"currency" text NOT NULL,
	"customer_balance_transaction" text,
	"discount_amount" integer DEFAULT 0,
	"discount_amounts" jsonb,
	"effective_at" timestamp,
	"lines" jsonb,
	"memo" text,
	"metadata" jsonb,
	"number" text,
	"out_of_band_amount" integer,
	"pdf" text,
	"reason" "credit_note_reason",
	"shipping_cost" jsonb,
	"status" "credit_note_status" NOT NULL,
	"subtotal" integer NOT NULL,
	"subtotal_excluding_tax" integer,
	"tax_amounts" jsonb,
	"total" integer NOT NULL,
	"total_excluding_tax" integer,
	"type" "credit_note_type" NOT NULL,
	"voided_at" timestamp,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_note_stripe_credit_note_id_unique" UNIQUE("stripe_credit_note_id")
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text,
	"object" text DEFAULT 'customer',
	"email" text,
	"name" text,
	"phone" text,
	"description" text,
	"address" jsonb,
	"shipping" jsonb,
	"tax" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	"balance" integer DEFAULT 0,
	"currency" text,
	"default_source_id" text,
	"delinquent" boolean DEFAULT false,
	"invoice_settings" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"customer_account" text,
	"business_name" text,
	"cash_balance" jsonb,
	"discount" jsonb,
	"individual_name" text,
	"invoice_credit_balance" jsonb,
	"invoice_prefix" text,
	"next_invoice_sequence" integer,
	"preferred_locales" text[],
	"sources" jsonb,
	"subscriptions" jsonb,
	"tax_exempt" "customer_tax_exempt" DEFAULT 'none',
	"test_clock_id" text,
	"application" text,
	"application_fee_percent" text,
	"on_behalf_of" text,
	"account_country" text,
	"account_name" text,
	"default_tax_rates" text[],
	"tax_ids" text[],
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "discount" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_discount_id" text,
	"object" text DEFAULT 'discount',
	"coupon_id" text NOT NULL,
	"customer_id" text,
	"promotion_code_id" text,
	"subscription_id" text,
	"start" timestamp NOT NULL,
	"end" timestamp,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discount_stripe_discount_id_unique" UNIQUE("stripe_discount_id")
);
--> statement-breakpoint
CREATE TABLE "dispute" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_dispute_id" text NOT NULL,
	"object" text DEFAULT 'dispute',
	"amount" integer NOT NULL,
	"charge_id" text NOT NULL,
	"currency" text NOT NULL,
	"enhanced_eligibility_types" text[] NOT NULL,
	"evidence" jsonb,
	"metadata" jsonb,
	"payment_intent_id" text,
	"reason" "dispute_reason" NOT NULL,
	"status" "dispute_status" NOT NULL,
	"balance_transactions" text[],
	"evidence_details" jsonb,
	"is_charge_refundable" boolean,
	"payment_method_details" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dispute_stripe_dispute_id_unique" UNIQUE("stripe_dispute_id")
);
--> statement-breakpoint
CREATE TABLE "invoice_item" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_invoice_item_id" text NOT NULL,
	"object" text DEFAULT 'invoiceitem',
	"customer_id" text NOT NULL,
	"invoice_id" text,
	"price_id" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"period" jsonb,
	"pricing" jsonb,
	"quantity" integer DEFAULT 1,
	"proration" boolean DEFAULT false,
	"date" timestamp,
	"customer_account" text,
	"discountable" boolean DEFAULT true,
	"discounts" text[],
	"livemode" boolean DEFAULT false NOT NULL,
	"tax_rates" text[],
	"net_amount" integer,
	"parent" jsonb,
	"proration_details" jsonb,
	"test_clock" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_item_stripe_invoice_item_id_unique" UNIQUE("stripe_invoice_item_id")
);
--> statement-breakpoint
CREATE TABLE "invoice_line_item" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_invoice_line_item_id" text NOT NULL,
	"object" text DEFAULT 'line_item',
	"invoice_id" text NOT NULL,
	"subscription_item_id" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"period" jsonb,
	"pricing" jsonb,
	"quantity" integer,
	"proration" boolean DEFAULT false,
	"discountable" boolean DEFAULT true,
	"discounts" text[],
	"tax_rates" text[],
	"type" "invoice_line_item_type",
	"discount_amounts" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"parent" jsonb,
	"pretax_credit_amounts" jsonb,
	"subtotal" integer,
	"taxes" jsonb,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_line_item_stripe_invoice_line_item_id_unique" UNIQUE("stripe_invoice_line_item_id")
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_invoice_id" text NOT NULL,
	"object" text DEFAULT 'invoice',
	"customer_id" text NOT NULL,
	"subscription_id" text,
	"payment_intent_id" text,
	"status" "invoice_status" NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"auto_advance" boolean DEFAULT true,
	"automatic_tax" jsonb,
	"collection_method" "subscription_collection_method" DEFAULT 'charge_automatically',
	"hosted_invoice_url" text,
	"invoice_pdf" text,
	"number" text,
	"lines" jsonb,
	"metadata" jsonb,
	"period_start" timestamp,
	"period_end" timestamp,
	"total" integer NOT NULL,
	"amount_due" integer NOT NULL,
	"amount_paid" integer DEFAULT 0,
	"amount_remaining" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"default_payment_method_id" text,
	"customer_account" text,
	"billing_reason" "invoice_billing_reason",
	"due_date" timestamp,
	"next_payment_attempt" timestamp,
	"livemode" boolean DEFAULT false NOT NULL,
	"confirmation_secret" jsonb,
	"attempted" boolean DEFAULT false,
	"discounts" text[],
	"account_country" text,
	"account_name" text,
	"account_tax_ids" text[],
	"customer_address" jsonb,
	"customer_email" text,
	"customer_name" text,
	"customer_phone" text,
	"customer_shipping" jsonb,
	"customer_tax_exempt" "customer_tax_exempt",
	"customer_tax_ids" text[],
	"amount_overpaid" integer DEFAULT 0,
	"amount_shipping" integer DEFAULT 0,
	"ending_balance" integer,
	"starting_balance" integer DEFAULT 0,
	"subtotal_excluding_tax" integer,
	"total_excluding_tax" integer,
	"post_payment_credit_notes_amount" integer DEFAULT 0,
	"pre_payment_credit_notes_amount" integer DEFAULT 0,
	"custom_fields" jsonb,
	"footer" text,
	"rendering" jsonb,
	"shipping_cost" jsonb,
	"shipping_details" jsonb,
	"statement_descriptor" text,
	"application" text,
	"issuer" jsonb,
	"on_behalf_of" text,
	"attempt_count" integer DEFAULT 0,
	"automatically_finalizes_at" timestamp,
	"default_source" text,
	"effective_at" timestamp,
	"from_invoice" jsonb,
	"last_finalization_error" jsonb,
	"latest_revision" text,
	"parent" jsonb,
	"payment_settings" jsonb,
	"payments" jsonb,
	"receipt_number" text,
	"status_transitions" jsonb,
	"test_clock" text,
	"threshold_reason" jsonb,
	"total_discount_amounts" jsonb,
	"total_pretax_credit_amounts" jsonb,
	"total_taxes" jsonb,
	"webhooks_delivered_at" timestamp,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"price_id" text,
	"product_snapshot" jsonb NOT NULL,
	"price_snapshot" jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"user_id" text,
	"guest_email" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"subtotal_amount" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"shipping_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"promotion_code_id" text,
	"shipping_rate_id" text,
	"notes" text,
	"metadata" jsonb,
	"paid_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "payment_intent" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"object" text DEFAULT 'payment_intent',
	"amount" integer NOT NULL,
	"amount_capturable" integer DEFAULT 0,
	"amount_received" integer DEFAULT 0,
	"automatic_payment_methods" jsonb,
	"currency" text NOT NULL,
	"customer_id" text,
	"description" text,
	"latest_charge_id" text,
	"metadata" jsonb,
	"payment_method_id" text,
	"receipt_email" text,
	"shipping" jsonb,
	"status" "payment_intent_status" NOT NULL,
	"setup_future_usage" "payment_intent_setup_future_usage",
	"capture_method" "payment_intent_capture_method" DEFAULT 'automatic',
	"confirmation_method" "payment_intent_confirmation_method" DEFAULT 'automatic',
	"client_secret" text,
	"customer_account" text,
	"last_payment_error" jsonb,
	"next_action" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"statement_descriptor" text,
	"statement_descriptor_suffix" text,
	"invoice_id" text,
	"canceled_at" timestamp,
	"cancellation_reason" text,
	"amount_details" jsonb,
	"payment_method_types" text[],
	"payment_method_options" jsonb,
	"processing" jsonb,
	"application" text,
	"application_fee_amount" integer,
	"on_behalf_of" text,
	"transfer_data" jsonb,
	"transfer_group" text,
	"review" text,
	"excluded_payment_method_types" text[],
	"hooks" jsonb,
	"payment_details" jsonb,
	"payment_method_configuration_details" jsonb,
	"presentment_details" jsonb,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_intent_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "payment_link" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_payment_link_id" text NOT NULL,
	"object" text DEFAULT 'payment_link',
	"active" boolean DEFAULT true NOT NULL,
	"after_completion" jsonb,
	"allow_promotion_codes" boolean DEFAULT false,
	"application" text,
	"application_fee_amount" integer,
	"application_fee_percent" text,
	"automatic_tax" jsonb,
	"billing_address_collection" "payment_link_billing_address_collection" DEFAULT 'auto',
	"consent_collection" jsonb,
	"currency" text NOT NULL,
	"custom_fields" jsonb,
	"custom_text" jsonb,
	"customer_creation" "payment_link_customer_creation" DEFAULT 'if_required',
	"inactive_message" text,
	"invoice_creation" jsonb,
	"line_items" jsonb,
	"metadata" jsonb,
	"on_behalf_of" text,
	"payment_intent_data" jsonb,
	"payment_method_collection" "payment_link_payment_method_collection" DEFAULT 'always',
	"payment_method_types" text[],
	"phone_number_collection" jsonb,
	"restrictions" jsonb,
	"shipping_address_collection" jsonb,
	"shipping_options" jsonb,
	"submit_type" "payment_link_submit_type" DEFAULT 'auto',
	"subscription_data" jsonb,
	"tax_id_collection" jsonb,
	"transfer_data" jsonb,
	"url" text,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_link_stripe_payment_link_id_unique" UNIQUE("stripe_payment_link_id")
);
--> statement-breakpoint
CREATE TABLE "payment_method" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_payment_method_id" text NOT NULL,
	"object" text DEFAULT 'payment_method',
	"type" "payment_method_type" NOT NULL,
	"customer_id" text,
	"billing_details" jsonb,
	"metadata" jsonb,
	"card" jsonb,
	"us_bank_account" jsonb,
	"sepa_debit" jsonb,
	"acss_debit" jsonb,
	"alipay" jsonb,
	"amazon_pay" jsonb,
	"cashapp" jsonb,
	"grabpay" jsonb,
	"kakao_pay" jsonb,
	"link" jsonb,
	"mobilepay" jsonb,
	"naver_pay" jsonb,
	"payco" jsonb,
	"paypal" jsonb,
	"paypay" jsonb,
	"revolut_pay" jsonb,
	"samsung_pay" jsonb,
	"wechat_pay" jsonb,
	"affirm" jsonb,
	"afterpay_clearpay" jsonb,
	"alma" jsonb,
	"billie" jsonb,
	"klarna" jsonb,
	"zip" jsonb,
	"au_becs_debit" jsonb,
	"bacs_debit" jsonb,
	"pay_by_bank" jsonb,
	"payto" jsonb,
	"nz_bank_account" jsonb,
	"bancontact" jsonb,
	"blik" jsonb,
	"boleto" jsonb,
	"eps" jsonb,
	"fpx" jsonb,
	"giropay" jsonb,
	"ideal" jsonb,
	"konbini" jsonb,
	"kr_card" jsonb,
	"mb_way" jsonb,
	"multibanco" jsonb,
	"oxxo" jsonb,
	"p24" jsonb,
	"paynow" jsonb,
	"pix" jsonb,
	"promptpay" jsonb,
	"satispay" jsonb,
	"sofort" jsonb,
	"swish" jsonb,
	"twint" jsonb,
	"card_present" jsonb,
	"interac_present" jsonb,
	"crypto" jsonb,
	"customer_balance" jsonb,
	"custom" jsonb,
	"radar_options" jsonb,
	"payment_method_data" jsonb,
	"allow_redisplay" text,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_method_stripe_payment_method_id_unique" UNIQUE("stripe_payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "price" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_price_id" text,
	"object" text DEFAULT 'price',
	"product_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"unit_amount" integer,
	"unit_amount_decimal" text,
	"type" "price_type" DEFAULT 'one_time' NOT NULL,
	"billing_scheme" "price_billing_scheme" DEFAULT 'per_unit',
	"recurring" jsonb,
	"tiers" jsonb,
	"tiers_mode" text,
	"tax_behavior" "tax_behavior" DEFAULT 'unspecified',
	"transform_quantity" jsonb,
	"lookup_key" text,
	"nickname" text,
	"metadata" jsonb,
	"currency_options" jsonb,
	"custom_unit_amount" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "price_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_product_id" text,
	"object" text DEFAULT 'product',
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"images" text[],
	"metadata" jsonb,
	"default_price_id" text,
	"shippable" boolean DEFAULT true,
	"tax_code" text,
	"unit_label" text,
	"url" text,
	"category_id" text,
	"statement_descriptor" text,
	"livemode" boolean DEFAULT false NOT NULL,
	"marketing_features" jsonb,
	"package_dimensions" jsonb,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_stripe_product_id_unique" UNIQUE("stripe_product_id")
);
--> statement-breakpoint
CREATE TABLE "promotion_code" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_promotion_code_id" text,
	"object" text DEFAULT 'promotion_code',
	"code" text NOT NULL,
	"coupon_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"max_redemptions" integer,
	"times_redeemed" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"restrictions" jsonb,
	"customer_id" text,
	"metadata" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"customer_account" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_code_stripe_promotion_code_id_unique" UNIQUE("stripe_promotion_code_id"),
	CONSTRAINT "promotion_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "quote" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_quote_id" text NOT NULL,
	"object" text DEFAULT 'quote',
	"customer_id" text,
	"status" "quote_status" NOT NULL,
	"amount_subtotal" integer,
	"amount_total" integer,
	"application" text,
	"application_fee_amount" integer,
	"application_fee_percent" text,
	"automatic_tax" jsonb,
	"collection_method" "quote_collection_method" DEFAULT 'charge_automatically',
	"computed_upfront_total" jsonb,
	"computed_recurring_total" jsonb,
	"currency" text,
	"default_tax_rates" text[],
	"description" text,
	"discounts" text[],
	"expires_at" timestamp NOT NULL,
	"footer" text,
	"from_quote_id" text,
	"header" text,
	"invoice_id" text,
	"invoice_settings" jsonb,
	"line_items" jsonb,
	"metadata" jsonb,
	"number" text,
	"on_behalf_of" text,
	"status_transitions" jsonb,
	"subscription_id" text,
	"subscription_data" jsonb,
	"subscription_schedule_id" text,
	"test_clock" text,
	"total_details" jsonb,
	"transfer_data" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_stripe_quote_id_unique" UNIQUE("stripe_quote_id")
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_refund_id" text,
	"object" text DEFAULT 'refund',
	"charge_id" text,
	"payment_intent_id" text,
	"order_id" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"reason" "refund_reason",
	"description" text,
	"failure_reason" text,
	"instructions_email" text,
	"receipt_number" text,
	"balance_transaction_id" text,
	"failure_balance_transaction_id" text,
	"next_action" jsonb,
	"destination_details" jsonb,
	"metadata" jsonb,
	"pending_reason" text,
	"source_transfer_reversal" text,
	"transfer_reversal" text,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refund_stripe_refund_id_unique" UNIQUE("stripe_refund_id")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setup_intent" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_setup_intent_id" text NOT NULL,
	"object" text DEFAULT 'setup_intent',
	"customer_id" text,
	"status" "setup_intent_status" NOT NULL,
	"usage" "setup_intent_usage" NOT NULL,
	"client_secret" text,
	"description" text,
	"metadata" jsonb,
	"payment_method_id" text,
	"payment_method_types" text[] NOT NULL,
	"automatic_payment_methods" jsonb,
	"application" text,
	"cancellation_reason" text,
	"last_setup_error" jsonb,
	"latest_attempt_id" text,
	"mandate_id" text,
	"next_action" jsonb,
	"on_behalf_of" text,
	"payment_method_configuration_details" jsonb,
	"payment_method_options" jsonb,
	"single_use_mandate" text,
	"customer_account" text,
	"flow_directions" text[],
	"attach_to_self" boolean DEFAULT false,
	"hooks" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "setup_intent_stripe_setup_intent_id_unique" UNIQUE("stripe_setup_intent_id")
);
--> statement-breakpoint
CREATE TABLE "shipping_rate" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_shipping_rate_id" text,
	"object" text DEFAULT 'shipping_rate',
	"display_name" text NOT NULL,
	"type" text DEFAULT 'fixed_amount' NOT NULL,
	"fixed_amount" jsonb NOT NULL,
	"tax_behavior" "tax_behavior" DEFAULT 'unspecified',
	"tax_code" text,
	"delivery_estimate" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_rate_stripe_shipping_rate_id_unique" UNIQUE("stripe_shipping_rate_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_item" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_subscription_item_id" text NOT NULL,
	"object" text DEFAULT 'subscription_item' NOT NULL,
	"subscription_id" text NOT NULL,
	"price_id" text NOT NULL,
	"price" jsonb,
	"quantity" integer DEFAULT 1,
	"metadata" jsonb,
	"billing_thresholds" jsonb,
	"discounts" text[],
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"tax_rates" text[],
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_item_stripe_subscription_item_id_unique" UNIQUE("stripe_subscription_item_id")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"object" text DEFAULT 'subscription',
	"customer_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"automatic_tax" jsonb,
	"items" jsonb,
	"billing_mode" jsonb,
	"billing_cycle_anchor" timestamp,
	"collection_method" "subscription_collection_method" DEFAULT 'charge_automatically',
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancel_at" timestamp,
	"ended_at" timestamp,
	"latest_invoice_id" text,
	"metadata" jsonb,
	"pending_setup_intent_id" text,
	"pending_update" jsonb,
	"customer_account" text,
	"default_payment_method_id" text,
	"discounts" text[],
	"days_until_due" integer,
	"cancellation_details" jsonb,
	"application" text,
	"application_fee_percent" text,
	"on_behalf_of" text,
	"transfer_data" jsonb,
	"billing_cycle_anchor_config" jsonb,
	"billing_thresholds" jsonb,
	"default_source" text,
	"default_tax_rates" text[],
	"invoice_settings" jsonb,
	"next_pending_invoice_item_invoice" timestamp,
	"pause_collection" jsonb,
	"payment_settings" jsonb,
	"pending_invoice_item_interval" jsonb,
	"presentment_details" jsonb,
	"schedule" text,
	"start_date" timestamp NOT NULL,
	"test_clock" text,
	"trial_settings" jsonb,
	"livemode" boolean DEFAULT false NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "tax_id" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_tax_id_id" text,
	"object" text DEFAULT 'tax_id',
	"customer_id" text NOT NULL,
	"type" "tax_id_type" NOT NULL,
	"value" text NOT NULL,
	"country" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_id_stripe_tax_id_id_unique" UNIQUE("stripe_tax_id_id")
);
--> statement-breakpoint
CREATE TABLE "tax_rate" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_tax_rate_id" text,
	"object" text DEFAULT 'tax_rate',
	"active" boolean DEFAULT true NOT NULL,
	"country" text,
	"description" text,
	"display_name" text NOT NULL,
	"inclusive" boolean DEFAULT false NOT NULL,
	"jurisdiction" text,
	"metadata" jsonb,
	"percentage" numeric(10, 4) NOT NULL,
	"state" text,
	"tax_type" text,
	"effective_percentage" numeric(10, 4),
	"flat_amount" jsonb,
	"rate_type" text,
	"livemode" boolean DEFAULT false NOT NULL,
	"jurisdiction_level" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rate_stripe_tax_rate_id_unique" UNIQUE("stripe_tax_rate_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_price_id_price_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."price"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_payment_intent_id_payment_intent_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_payment_intent_id_payment_intent_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_setup_intent_id_setup_intent_id_fk" FOREIGN KEY ("setup_intent_id") REFERENCES "public"."setup_intent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_refund_id_refund_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refund"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_promotion_code_id_promotion_code_id_fk" FOREIGN KEY ("promotion_code_id") REFERENCES "public"."promotion_code"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_charge_id_charge_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."charge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_payment_intent_id_payment_intent_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_price_id_price_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."price"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_subscription_item_id_subscription_item_id_fk" FOREIGN KEY ("subscription_item_id") REFERENCES "public"."subscription_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_payment_intent_id_payment_intent_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_price_id_price_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."price"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_promotion_code_id_promotion_code_id_fk" FOREIGN KEY ("promotion_code_id") REFERENCES "public"."promotion_code"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intent" ADD CONSTRAINT "payment_intent_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price" ADD CONSTRAINT "price_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_code" ADD CONSTRAINT "promotion_code_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_code" ADD CONSTRAINT "promotion_code_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_charge_id_charge_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."charge"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_intent_id_payment_intent_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_intent" ADD CONSTRAINT "setup_intent_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_item" ADD CONSTRAINT "subscription_item_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_item" ADD CONSTRAINT "subscription_item_price_id_price_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."price"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_id" ADD CONSTRAINT "tax_id_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;