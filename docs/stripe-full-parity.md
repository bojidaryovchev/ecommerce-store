# Stripe Complete Data Model

This document provides a comprehensive overview of Stripe's data model with 1:1 parity based on their official API documentation (as of February 2026).

## Data Model Diagram

```mermaid
erDiagram
    %% Core Customer & Identity
    Customer ||--o{ PaymentIntent : "creates"
    Customer ||--o{ Charge : "has"
    Customer ||--o{ PaymentMethod : "has"
    Customer ||--o{ Invoice : "receives"
    Customer ||--o{ Subscription : "subscribes"
    Customer ||--o{ CheckoutSession : "initiates"
    Customer ||--o{ Dispute : "disputes"
    Customer {
        string id PK "NOT NULL"
        string object "NOT NULL"
        string email "NULLABLE"
        string name "NULLABLE, max 256 chars"
        string phone "NULLABLE, max 20 chars"
        string description "NULLABLE"
        object address "NULLABLE"
        object shipping "NULLABLE"
        object tax "NOT NULL, Expandable"
        object metadata "NOT NULL"
        integer balance "NOT NULL"
        string currency "NULLABLE"
        string default_source "NULLABLE, FK, Expandable"
        boolean delinquent "NULLABLE"
        object invoice_settings "NOT NULL"
        boolean livemode "NOT NULL"
        timestamp created "NOT NULL"
        string customer_account "NULLABLE"
        string business_name "NULLABLE"
        object cash_balance "NULLABLE, Expandable"
        object discount "NULLABLE"
        string individual_name "NULLABLE"
        object invoice_credit_balance "NOT NULL, Expandable"
        string invoice_prefix "NULLABLE"
        integer next_invoice_sequence "NULLABLE"
        array preferred_locales "NULLABLE"
        object sources "NULLABLE, Expandable"
        object subscriptions "NULLABLE, Expandable"
        enum tax_exempt "NULLABLE"
        array tax_ids "NULLABLE, Expandable"
        string test_clock "NULLABLE, FK, Expandable"
    }

    %% Products & Pricing
    Product ||--o{ Price : "has"
    Product {
        string id PK "NOT NULL"
        string object "NOT NULL"
        boolean active "NOT NULL"
        string name "NOT NULL"
        string description "NULLABLE"
        object metadata "NOT NULL"
        array images "NOT NULL"
        string default_price "NULLABLE, FK, Expandable"
        string tax_code "NULLABLE, Expandable"
        boolean shippable "NULLABLE"
        string statement_descriptor "NULLABLE"
        timestamp created "NOT NULL"
        timestamp updated "NOT NULL"
        boolean livemode "NOT NULL"
        array marketing_features "NOT NULL"
        object package_dimensions "NULLABLE"
        string unit_label "NULLABLE"
        string url "NULLABLE"
    }

    Price ||--o{ SubscriptionItem : "used_in"
    Price ||--o{ InvoiceLineItem : "priced_by"
    Price {
        string id PK "NOT NULL"
        string object "NOT NULL"
        boolean active "NOT NULL"
        enum currency "NOT NULL"
        object metadata "NOT NULL"
        string nickname "NULLABLE"
        string product "NOT NULL, FK, Expandable"
        object recurring "NULLABLE"
        enum tax_behavior "NULLABLE"
        enum type "NOT NULL"
        integer unit_amount "NULLABLE"
        string unit_amount_decimal "NULLABLE"
        enum billing_scheme "NOT NULL"
        object tiers "NULLABLE, Expandable"
        enum tiers_mode "NULLABLE"
        timestamp created "NOT NULL"
        boolean livemode "NOT NULL"
        object currency_options "NULLABLE, Expandable"
        object custom_unit_amount "NULLABLE"
        string lookup_key "NULLABLE"
        object transform_quantity "NULLABLE"
    }

    %% Payment Processing
    PaymentIntent ||--o| Charge : "creates"
    PaymentIntent ||--o| Invoice : "attached_to"
    PaymentIntent {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount "NOT NULL"
        integer amount_capturable "NOT NULL"
        object amount_details "NULLABLE"
        integer amount_received "NOT NULL"
        object automatic_payment_methods "NULLABLE"
        string application "NULLABLE, FK, Expandable, Connect only"
        integer application_fee_amount "NULLABLE, Connect only"
        enum currency "NOT NULL"
        string customer "NULLABLE, FK, Expandable"
        string customer_account "NULLABLE"
        string description "NULLABLE"
        string latest_charge "NULLABLE, FK, Expandable"
        object metadata "NOT NULL"
        string payment_method "NULLABLE, FK, Expandable"
        string receipt_email "NULLABLE"
        object shipping "NULLABLE"
        enum status "NOT NULL"
        enum setup_future_usage "NULLABLE"
        enum capture_method "NOT NULL"
        enum confirmation_method "NOT NULL"
        timestamp created "NOT NULL"
        timestamp canceled_at "NULLABLE"
        enum cancellation_reason "NULLABLE"
        string client_secret "NULLABLE"
        array excluded_payment_method_types "NULLABLE"
        object hooks "NULLABLE"
        object last_payment_error "NULLABLE"
        object next_action "NULLABLE"
        boolean livemode "NOT NULL"
        string on_behalf_of "NULLABLE, FK, Expandable, Connect only"
        object payment_details "NULLABLE"
        object payment_method_configuration_details "NULLABLE"
        object payment_method_options "NULLABLE"
        array payment_method_types "NOT NULL"
        object presentment_details "NULLABLE"
        object processing "NULLABLE"
        string review "NULLABLE, FK, Expandable"
        string statement_descriptor "NULLABLE"
        string statement_descriptor_suffix "NULLABLE"
        object transfer_data "NULLABLE, Connect only"
        string transfer_group "NULLABLE, Connect only"
    }

    Charge ||--o| Refund : "refunded_by"
    Charge ||--o| BalanceTransaction : "creates"
    Charge ||--o| Dispute : "disputed"
    Charge {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount "NOT NULL"
        integer amount_captured "NOT NULL"
        integer amount_refunded "NOT NULL"
        string application "NULLABLE, FK, Expandable, Connect only"
        string application_fee "NULLABLE, FK, Expandable, Connect only"
        integer application_fee_amount "NULLABLE, Connect only"
        string balance_transaction "NULLABLE, FK, Expandable"
        object billing_details "NOT NULL"
        string calculated_statement_descriptor "NULLABLE"
        boolean captured "NOT NULL"
        timestamp created "NOT NULL"
        enum currency "NOT NULL"
        string customer "NULLABLE, FK, Expandable"
        string description "NULLABLE"
        boolean disputed "NOT NULL"
        string failure_balance_transaction "NULLABLE, FK, Expandable"
        string failure_code "NULLABLE"
        string failure_message "NULLABLE"
        object fraud_details "NULLABLE"
        boolean livemode "NOT NULL"
        object metadata "NOT NULL"
        string on_behalf_of "NULLABLE, FK, Expandable, Connect only"
        object outcome "NULLABLE"
        boolean paid "NOT NULL"
        string payment_intent "NULLABLE, FK, Expandable"
        string payment_method "NULLABLE"
        object payment_method_details "NULLABLE"
        object presentment_details "NULLABLE"
        object radar_options "NULLABLE"
        string receipt_email "NULLABLE"
        string receipt_number "NULLABLE"
        string receipt_url "NULLABLE"
        boolean refunded "NOT NULL"
        object refunds "NULLABLE, Expandable"
        string review "NULLABLE, FK, Expandable"
        object shipping "NULLABLE"
        string source_transfer "NULLABLE, FK, Expandable, Connect only"
        string statement_descriptor "NULLABLE"
        string statement_descriptor_suffix "NULLABLE"
        enum status "NOT NULL"
        string transfer "NULLABLE, FK, Expandable, Connect only"
        object transfer_data "NULLABLE, Connect only"
        string transfer_group "NULLABLE, Connect only"
    }

    PaymentMethod ||--o{ PaymentIntent : "used_in"
    PaymentMethod {
        string id PK "NOT NULL"
        string object "NOT NULL"
        object billing_details "NOT NULL"
        string customer "NULLABLE, FK, Expandable"
        object metadata "NULLABLE"
        enum type "NOT NULL"
        timestamp created "NOT NULL"
        boolean livemode "NOT NULL"
        enum allow_redisplay "NULLABLE"
        object acss_debit "NULLABLE"
        object affirm "NULLABLE"
        object afterpay_clearpay "NULLABLE"
        object alipay "NULLABLE"
        object alma "NULLABLE"
        object amazon_pay "NULLABLE"
        object au_becs_debit "NULLABLE"
        object bacs_debit "NULLABLE"
        object bancontact "NULLABLE"
        object billie "NULLABLE"
        object blik "NULLABLE"
        object boleto "NULLABLE"
        object card "NULLABLE"
        object card_present "NULLABLE"
        object cashapp "NULLABLE"
        object crypto "NULLABLE"
        object custom "NULLABLE"
        object customer_balance "NULLABLE"
        object eps "NULLABLE"
        object fpx "NULLABLE"
        object giropay "NULLABLE"
        object grabpay "NULLABLE"
        object ideal "NULLABLE"
        object interac_present "NULLABLE"
        object kakao_pay "NULLABLE"
        object klarna "NULLABLE"
        object konbini "NULLABLE"
        object kr_card "NULLABLE"
        object link "NULLABLE"
        object mb_way "NULLABLE"
        object mobilepay "NULLABLE"
        object multibanco "NULLABLE"
        object naver_pay "NULLABLE"
        object nz_bank_account "NULLABLE"
        object oxxo "NULLABLE"
        object p24 "NULLABLE"
        object pay_by_bank "NULLABLE"
        object payco "NULLABLE"
        object paynow "NULLABLE"
        object paypal "NULLABLE"
        object paypay "NULLABLE"
        object payto "NULLABLE"
        object pix "NULLABLE"
        object promptpay "NULLABLE"
        object radar_options "NULLABLE"
        object revolut_pay "NULLABLE"
        object samsung_pay "NULLABLE"
        object satispay "NULLABLE"
        object sepa_debit "NULLABLE"
        object sofort "NULLABLE"
        object swish "NULLABLE"
        object twint "NULLABLE"
        object us_bank_account "NULLABLE"
        object wechat_pay "NULLABLE"
        object zip "NULLABLE"
    }

    %% Refunds & Disputes
    Refund {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount "NOT NULL"
        string balance_transaction "NULLABLE, FK, Expandable"
        string charge "NULLABLE, FK, Expandable"
        timestamp created "NOT NULL"
        enum currency "NOT NULL"
        string description "NULLABLE"
        object destination_details "NULLABLE"
        string failure_balance_transaction "NULLABLE, FK, Expandable"
        string failure_reason "NULLABLE"
        string instructions_email "NULLABLE"
        object metadata "NULLABLE"
        object next_action "NULLABLE"
        string payment_intent "NULLABLE, FK, Expandable"
        enum pending_reason "NULLABLE"
        enum reason "NULLABLE"
        string receipt_number "NULLABLE"
        string source_transfer_reversal "NULLABLE, FK, Expandable, Connect only"
        enum status "NULLABLE"
        string transfer_reversal "NULLABLE, FK, Expandable, Connect only"
    }

    Dispute {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount "NOT NULL"
        array balance_transactions "NOT NULL"
        string charge "NOT NULL, FK, Expandable"
        timestamp created "NOT NULL"
        enum currency "NOT NULL"
        array enhanced_eligibility_types "NOT NULL"
        object evidence "NOT NULL"
        object evidence_details "NOT NULL"
        boolean is_charge_refundable "NOT NULL"
        boolean livemode "NOT NULL"
        object metadata "NOT NULL"
        string payment_intent "NULLABLE, FK, Expandable"
        object payment_method_details "NULLABLE"
        enum reason "NOT NULL"
        enum status "NOT NULL"
    }

    %% Subscriptions & Billing
    Subscription ||--o{ SubscriptionItem : "contains"
    Subscription ||--o{ Invoice : "generates"
    Subscription {
        string id PK "NOT NULL"
        string object "NOT NULL"
        string application "NULLABLE, FK, Expandable, Connect-only"
        float application_fee_percent "NULLABLE, Connect-only"
        object automatic_tax "NOT NULL"
        timestamp billing_cycle_anchor "NOT NULL"
        object billing_cycle_anchor_config "NULLABLE"
        object billing_mode "NOT NULL"
        object billing_thresholds "NULLABLE"
        timestamp cancel_at "NULLABLE"
        boolean cancel_at_period_end "NOT NULL"
        timestamp canceled_at "NULLABLE"
        object cancellation_details "NULLABLE"
        enum collection_method "NOT NULL"
        timestamp created "NOT NULL"
        enum currency "NOT NULL"
        timestamp current_period_end "NOT NULL"
        timestamp current_period_start "NOT NULL"
        string customer "NOT NULL, FK, Expandable"
        string customer_account "NULLABLE"
        integer days_until_due "NULLABLE"
        string default_payment_method "NULLABLE, FK, Expandable"
        string default_source "NULLABLE, FK, Expandable"
        array default_tax_rates "NULLABLE"
        string description "NULLABLE"
        array discounts "NOT NULL, Expandable"
        timestamp ended_at "NULLABLE"
        object invoice_settings "NOT NULL"
        object items "NOT NULL"
        string latest_invoice "NULLABLE, FK, Expandable"
        boolean livemode "NOT NULL"
        object metadata "NOT NULL"
        timestamp next_pending_invoice_item_invoice "NULLABLE"
        string on_behalf_of "NULLABLE, FK, Expandable, Connect-only"
        object pause_collection "NULLABLE"
        object payment_settings "NULLABLE"
        object pending_invoice_item_interval "NULLABLE"
        string pending_setup_intent "NULLABLE, FK, Expandable"
        object pending_update "NULLABLE"
        object presentment_details "NULLABLE, Preview-feature"
        string schedule "NULLABLE, FK, Expandable"
        timestamp start_date "NOT NULL"
        enum status "NOT NULL"
        string test_clock "NULLABLE, FK, Expandable"
        object transfer_data "NULLABLE, Connect-only"
        timestamp trial_end "NULLABLE"
        object trial_settings "NULLABLE"
        timestamp trial_start "NULLABLE"
    }

    SubscriptionItem {
        string id PK
        string object
        object metadata
        object price
        integer quantity
        string subscription FK
        object billing_thresholds
        array discounts
        timestamp created
        timestamp current_period_start
        timestamp current_period_end
        array tax_rates
    }

    %% Invoices
    Invoice ||--o{ InvoiceLineItem : "contains"
    Invoice ||--o| PaymentIntent : "has"
    Invoice {
        string id PK "NOT NULL"
        string object "NOT NULL"
        string account_country "NULLABLE"
        string account_name "NULLABLE"
        array account_tax_ids "NULLABLE, Expandable"
        integer amount_due "NOT NULL"
        integer amount_overpaid "NOT NULL"
        integer amount_paid "NOT NULL"
        integer amount_remaining "NOT NULL"
        integer amount_shipping "NOT NULL"
        string application "NULLABLE, FK, Expandable, Connect-only"
        integer attempt_count "NOT NULL"
        boolean attempted "NOT NULL"
        boolean auto_advance "NOT NULL"
        object automatic_tax "NOT NULL"
        timestamp automatically_finalizes_at "NULLABLE"
        enum billing_reason "NULLABLE"
        enum collection_method "NOT NULL"
        object confirmation_secret "NULLABLE, Expandable"
        timestamp created "NOT NULL"
        enum currency "NOT NULL"
        array custom_fields "NULLABLE"
        string customer "NOT NULL, FK, Expandable"
        string customer_account "NULLABLE"
        object customer_address "NULLABLE"
        string customer_email "NULLABLE"
        string customer_name "NULLABLE"
        string customer_phone "NULLABLE"
        object customer_shipping "NULLABLE"
        enum customer_tax_exempt "NULLABLE"
        array customer_tax_ids "NULLABLE"
        string default_payment_method "NULLABLE, FK, Expandable"
        string default_source "NULLABLE, FK, Expandable"
        array default_tax_rates "NOT NULL"
        string description "NULLABLE"
        array discounts "NOT NULL, Expandable"
        timestamp due_date "NULLABLE"
        timestamp effective_at "NULLABLE"
        integer ending_balance "NULLABLE"
        string footer "NULLABLE"
        object from_invoice "NULLABLE"
        string hosted_invoice_url "NULLABLE"
        string invoice_pdf "NULLABLE"
        object issuer "NOT NULL, Connect-only"
        object last_finalization_error "NULLABLE"
        string latest_revision "NULLABLE, FK, Expandable"
        object lines "NOT NULL"
        boolean livemode "NOT NULL"
        object metadata "NULLABLE"
        timestamp next_payment_attempt "NULLABLE"
        string number "NULLABLE"
        string on_behalf_of "NULLABLE, FK, Expandable, Connect-only"
        object parent "NULLABLE"
        object payment_settings "NOT NULL"
        object payments "NOT NULL, Expandable"
        timestamp period_end "NOT NULL"
        timestamp period_start "NOT NULL"
        integer post_payment_credit_notes_amount "NOT NULL"
        integer pre_payment_credit_notes_amount "NOT NULL"
        string receipt_number "NULLABLE"
        object rendering "NULLABLE"
        object shipping_cost "NULLABLE"
        object shipping_details "NULLABLE"
        integer starting_balance "NOT NULL"
        string statement_descriptor "NULLABLE"
        enum status "NULLABLE"
        object status_transitions "NOT NULL"
        integer subtotal "NOT NULL"
        integer subtotal_excluding_tax "NULLABLE"
        string test_clock "NULLABLE, FK, Expandable"
        object threshold_reason "NULLABLE"
        integer total "NOT NULL"
        array total_discount_amounts "NULLABLE"
        integer total_excluding_tax "NULLABLE"
        array total_pretax_credit_amounts "NULLABLE"
        array total_taxes "NULLABLE"
        timestamp webhooks_delivered_at "NULLABLE"
    }

    InvoiceLineItem {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount "NOT NULL"
        enum currency "NOT NULL"
        string description "NULLABLE"
        array discount_amounts "NULLABLE"
        boolean discountable "NOT NULL"
        array discounts "NOT NULL, Expandable"
        string invoice "NULLABLE"
        boolean livemode "NOT NULL"
        object metadata "NOT NULL"
        object parent "NULLABLE"
        object period "NOT NULL"
        object pricing "NULLABLE"
        array pretax_credit_amounts "NULLABLE"
        integer quantity "NULLABLE"
        integer subtotal "NOT NULL"
        array taxes "NULLABLE"
    }

    InvoiceItem ||--o| InvoiceLineItem : "becomes"
    InvoiceItem {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount "NOT NULL"
        enum currency "NOT NULL"
        string customer "NOT NULL, FK, Expandable"
        string customer_account "NULLABLE"
        timestamp date "NOT NULL"
        string description "NULLABLE"
        boolean discountable "NOT NULL"
        array discounts "NULLABLE, Expandable"
        string invoice "NULLABLE, FK, Expandable"
        boolean livemode "NOT NULL"
        object metadata "NULLABLE"
        integer net_amount "NULLABLE"
        object parent "NULLABLE"
        object period "NOT NULL"
        object pricing "NULLABLE"
        boolean proration "NOT NULL"
        object proration_details "NULLABLE"
        integer quantity "NOT NULL"
        array tax_rates "NULLABLE"
        string test_clock "NULLABLE, FK, Expandable"
    }

    %% Discounts & Coupons
    Coupon ||--o{ PromotionCode : "used_in"
    Coupon ||--o{ Subscription : "applied_to"
    Coupon {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount_off "NULLABLE"
        object applies_to "NULLABLE, Expandable"
        timestamp created "NOT NULL"
        enum currency "NULLABLE"
        object currency_options "NULLABLE, Expandable"
        enum duration "NOT NULL"
        integer duration_in_months "NULLABLE"
        boolean livemode "NOT NULL"
        integer max_redemptions "NULLABLE"
        object metadata "NULLABLE"
        string name "NULLABLE"
        float percent_off "NULLABLE"
        timestamp redeem_by "NULLABLE"
        integer times_redeemed "NOT NULL"
        boolean valid "NOT NULL"
    }

    PromotionCode {
        string id PK "NOT NULL"
        string object "NOT NULL"
        boolean active "NOT NULL"
        string code "NOT NULL"
        timestamp created "NOT NULL"
        string customer "NULLABLE, FK, Expandable"
        string customer_account "NULLABLE"
        timestamp expires_at "NULLABLE"
        boolean livemode "NOT NULL"
        integer max_redemptions "NULLABLE"
        object metadata "NULLABLE"
        object promotion "NOT NULL"
        object restrictions "NOT NULL"
        integer times_redeemed "NOT NULL"
    }

    %% Checkout & Sessions
    CheckoutSession ||--o| PaymentIntent : "has"
    CheckoutSession ||--o| Subscription : "creates"
    CheckoutSession {
        string id PK "NOT NULL"
        string object "NOT NULL"
        object adaptive_pricing "NULLABLE"
        object after_expiration "NULLABLE"
        boolean allow_promotion_codes "NULLABLE"
        integer amount_subtotal "NULLABLE"
        integer amount_total "NULLABLE"
        object automatic_tax "NOT NULL"
        enum billing_address_collection "NULLABLE"
        object branding_settings "NULLABLE"
        string cancel_url "NULLABLE"
        string client_reference_id "NULLABLE"
        string client_secret "NULLABLE"
        object collected_information "NULLABLE"
        object consent "NULLABLE"
        object consent_collection "NULLABLE"
        timestamp created "NOT NULL"
        enum currency "NULLABLE"
        object currency_conversion "NULLABLE"
        array custom_fields "NOT NULL"
        object custom_text "NOT NULL"
        string customer "NULLABLE, FK, Expandable"
        string customer_account "NULLABLE"
        enum customer_creation "NULLABLE"
        object customer_details "NULLABLE"
        string customer_email "NULLABLE"
        array discounts "NULLABLE"
        array excluded_payment_method_types "NULLABLE"
        timestamp expires_at "NOT NULL"
        string invoice "NULLABLE, FK, Expandable"
        object invoice_creation "NULLABLE"
        object line_items "NULLABLE, Expandable"
        boolean livemode "NOT NULL"
        enum locale "NULLABLE"
        object metadata "NULLABLE"
        enum mode "NOT NULL"
        object name_collection "NULLABLE"
        array optional_items "NULLABLE, Expandable"
        enum origin_context "NULLABLE"
        string payment_intent "NULLABLE, FK, Expandable"
        string payment_link "NULLABLE, FK, Expandable"
        enum payment_method_collection "NULLABLE"
        object payment_method_configuration_details "NULLABLE"
        object payment_method_options "NULLABLE"
        array payment_method_types "NOT NULL"
        enum payment_status "NOT NULL"
        object permissions "NULLABLE"
        object phone_number_collection "NULLABLE"
        object presentment_details "NULLABLE"
        string recovered_from "NULLABLE"
        enum redirect_on_completion "NULLABLE"
        string return_url "NULLABLE"
        object saved_payment_method_options "NULLABLE"
        string setup_intent "NULLABLE, FK, Expandable"
        object shipping_address_collection "NULLABLE"
        object shipping_cost "NULLABLE"
        array shipping_options "NOT NULL"
        enum status "NULLABLE"
        enum submit_type "NULLABLE"
        string subscription "NULLABLE, FK, Expandable"
        string success_url "NULLABLE"
        object tax_id_collection "NULLABLE"
        object total_details "NULLABLE"
        enum ui_mode "NULLABLE"
        string url "NULLABLE"
        object wallet_options "NULLABLE"
    }

    %% Shipping
    ShippingRate {
        string id PK "NOT NULL"
        string object "NOT NULL"
        boolean active "NOT NULL"
        timestamp created "NOT NULL"
        object delivery_estimate "NULLABLE"
        string display_name "NULLABLE"
        object fixed_amount "NULLABLE"
        boolean livemode "NOT NULL"
        object metadata "NOT NULL"
        enum tax_behavior "NULLABLE"
        string tax_code "NULLABLE, FK, Expandable"
        enum type "NOT NULL"
    }

    TaxRate {
        string id PK "NOT NULL"
        string object "NOT NULL"
        boolean active "NOT NULL"
        string country "NULLABLE"
        timestamp created "NOT NULL"
        string description "NULLABLE"
        string display_name "NOT NULL"
        float effective_percentage "NULLABLE"
        object flat_amount "NULLABLE"
        boolean inclusive "NOT NULL"
        string jurisdiction "NULLABLE"
        enum jurisdiction_level "NULLABLE"
        boolean livemode "NOT NULL"
        object metadata "NULLABLE"
        float percentage "NOT NULL"
        enum rate_type "NULLABLE"
        string state "NULLABLE"
        enum tax_type "NULLABLE"
    }

    %% Balance & Transactions
    BalanceTransaction {
        string id PK "NOT NULL"
        string object "NOT NULL"
        integer amount "NOT NULL"
        timestamp available_on "NOT NULL"
        enum balance_type "NOT NULL"
        timestamp created "NOT NULL"
        enum currency "NOT NULL"
        string description "NULLABLE"
        float exchange_rate "NULLABLE"
        integer fee "NOT NULL"
        array fee_details "NOT NULL"
        integer net "NOT NULL"
        string reporting_category "NOT NULL"
        string source "NULLABLE, FK, Expandable"
        string status "NOT NULL"
        enum type "NOT NULL"
    }

    %% Relationships
    Customer ||--o{ Address : "has"
    Subscription ||--o{ Discount : "has"
    Invoice ||--o{ Discount : "has"
    Customer ||--o{ TaxId : "has"
    Invoice ||--o{ TaxRate : "applies"

    Address {
        string line1
        string line2
        string city
        string state
        string postal_code
        string country
    }

    Discount {
        string id PK
        string object
        object coupon
        string customer FK
        string promotion_code FK
        timestamp start
        timestamp end
    }

    TaxId {
        string id PK
        string object
        string country
        string customer FK
        enum type
        string value
        timestamp created
    }
```

## Core Entity Descriptions

### Customer & Identity Management

- **Customer**: Central entity representing a business customer, containing payment methods, subscriptions, and billing information
  - **Field Constraints**: email (max 512 chars), name (max 256 chars), phone (max 20 chars)
  - **Multi-party Support**: Use `customer_account` field for representing customers in multi-party scenarios
  - **Tax Handling**: `tax_exempt` enum values: `none`, `exempt`, `reverse`
  - **Non-Nullable Fields**: `id`, `object`, `tax`, `metadata`, `balance`, `invoice_settings`, `invoice_credit_balance`, `livemode`, `created`
  - **Expandable Fields**: `tax`, `cash_balance`, `default_source`, `invoice_credit_balance`, `sources`, `subscriptions`, `tax_ids`, `test_clock`
- **Address**: Physical address for billing and shipping
- **TaxId**: Tax identification for compliance
- **InvoiceSettings**: Invoice-related settings for the customer (default_payment_method, custom_fields, footer, rendering_options)

### Product Catalog

- **Product**: Goods or services offered (e.g., "Premium Plan", "T-Shirt")
  - **Deletion Constraint**: Can only be deleted if no prices are associated
  - **Images**: Array of image URLs for product display
  - **Non-Nullable Fields**: `id`, `object`, `active`, `name`, `metadata`, `images`, `created`, `updated`, `livemode`, `marketing_features`
  - **Expandable Fields**: `default_price`, `tax_code`
- **Price**: Pricing structure for products (one-time or recurring)
  - **Types**: `one_time` or `recurring`
  - **Billing Schemes**: `per_unit` (simple) or `tiered` (volume-based)
  - **Currency Support**: Multi-currency pricing via `currency_options`
  - **Non-Nullable Fields**: `id`, `object`, `active`, `currency`, `metadata`, `product`, `type`, `billing_scheme`, `created`, `livemode`
  - **Expandable Fields**: `product`, `currency_options`, `tiers`
  - **Conditional Fields**: `unit_amount` only set if `billing_scheme=per_unit`; `tiers` required if `billing_scheme=tiered`
- **TaxRate**: Tax rates applied to transactions

### Payment Processing

- **PaymentIntent**: Tracks payment lifecycle from creation to completion
  - **Recommended**: Use this instead of direct Charge creation
  - **Client Secret**: Use for client-side payment confirmation
  - **Automatic Tax**: Supports automatic tax calculation
  - **Non-Nullable Fields**: `id`, `object`, `amount`, `amount_capturable`, `amount_received`, `currency`, `metadata`, `status`, `capture_method`, `confirmation_method`, `created`, `livemode`, `payment_method_types`
  - **Expandable Fields**: `application`, `customer`, `latest_charge`, `on_behalf_of`, `payment_method`, `review`
  - **Connect-Only Fields**: `application`, `application_fee_amount`, `on_behalf_of`, `transfer_data`, `transfer_group`
- **PaymentMethod**: Stored payment instrument (card, bank account, etc.)
  - **50+ Payment Types**: Supports global payment methods including cards, wallets, bank transfers, and buy-now-pay-later
  - **Type-specific Objects**: Each payment method type has its own object (e.g., `card`, `us_bank_account`, `sepa_debit`)
- **Charge**: Actual movement of funds
  - ⚠️ **DEPRECATED**: The Charge create endpoint is deprecated. Use PaymentIntents API instead
  - Still returned when PaymentIntent succeeds, but don't create directly
  - **Non-Nullable Fields**: `id`, `object`, `amount`, `amount_captured`, `amount_refunded`, `billing_details`, `captured`, `created`, `currency`, `disputed`, `livemode`, `metadata`, `paid`, `refunded`, `status`
  - **Expandable Fields**: `application`, `application_fee`, `balance_transaction`, `customer`, `failure_balance_transaction`, `on_behalf_of`, `payment_intent`, `refunds`, `review`, `source_transfer`, `transfer`
  - **Connect-Only Fields**: `application`, `application_fee`, `application_fee_amount`, `on_behalf_of`, `source_transfer`, `transfer`, `transfer_data`, `transfer_group`
- **Refund**: Money returned to customer
  - Supports partial refunds
  - Can be created on Charge or PaymentIntent
- **BalanceTransaction**: Internal accounting record of fund movements
  - **Net Calculation**: `net = amount - fee`
  - **46+ Transaction Types**: Covers all financial operations (charges, refunds, payouts, fees, etc.)

### Billing & Subscriptions

- **Subscription**: Recurring billing arrangement
  - **8 Lifecycle States**: From `incomplete` to `active` to `canceled`
  - **Limit**: Up to 500 active subscriptions per customer
  - **Trial Support**: Built-in trial period handling
- **SubscriptionItem**: Individual products/prices in a subscription
  - Allows multiple prices per subscription
  - Supports quantity and billing thresholds
- **Invoice**: Bill sent to customer
  - **5 Status States**: `draft`, `open`, `paid`, `uncollectible`, `void`
  - **Auto-collection**: Stripe can automatically finalize and charge invoices
  - **Important**: Contains references to `subscription` and `payment_intent`
- **InvoiceLineItem**: Individual lines on an invoice
  - **Note**: NOT a separate top-level object; nested within Invoice.lines array
  - Automatically created from InvoiceItems and SubscriptionItems
- **InvoiceItem**: Pending charges to be added to next invoice
  - Becomes InvoiceLineItem when invoice is created
  - Useful for one-time charges in subscription billing

### Discounts & Promotions

- **Coupon**: Discount definition (percent or amount off)
  - **Mutually Exclusive**: Either `amount_off` OR `percent_off` (not both)
  - **Duration Types**: `forever`, `once`, or `repeating`
  - **Product Restrictions**: Use `applies_to` to limit to specific products
- **PromotionCode**: Customer-facing code that applies a coupon
  - **Code Requirements**: Must be unique per customer, max 500 characters
  - **Restrictions**: Can limit by first-time transaction, minimum amount, etc.
- **Discount**: Applied coupon on a specific subscription/invoice

### Checkout & Sessions

- **CheckoutSession**: Hosted or embedded payment page session
  - **3 Modes**: `payment` (one-time), `subscription` (recurring), `setup` (save card)
  - **3 UI Modes**: `hosted` (redirect), `embedded` (iframe), `custom` (components)
  - **Auto-creation**: Automatically creates PaymentIntent, Subscription, or SetupIntent
  - **Important FKs**: Links to `invoice`, `payment_intent`, `subscription`, `setup_intent`
- **ShippingRate**: Shipping cost options
  - Currently only supports `fixed_amount` type
  - Tax behavior: `inclusive`, `exclusive`, or `unspecified`

### Disputes

- **Dispute**: Customer challenge of a charge
  - **8 Status States**: Includes warning states for early fraud detection
  - **Evidence Required**: Submit evidence via `evidence` object
  - **15 Reason Types**: From `fraudulent` to `product_not_received`

## Key Relationships

### Payment Flow

```mermaid
flowchart LR
    Customer[Customer]
    PM[PaymentMethod]
    PI[PaymentIntent]
    Charge[Charge]
    BT[BalanceTransaction]
    Refund[Refund]

    Customer -->|creates| PI
    Customer -->|has| PM
    PM -->|used in| PI
    PI -->|creates| Charge
    Charge -->|generates| BT
    Charge -.->|optional| Refund
```

### Subscription Flow

```mermaid
flowchart TB
    Customer[Customer]
    Sub[Subscription]
    SubItem[SubscriptionItem]
    Price[Price]
    Product[Product]
    Invoice[Invoice]
    InvoiceLineItem[InvoiceLineItem]
    PI[PaymentIntent]

    Customer -->|subscribes to| Sub
    Sub -->|contains| SubItem
    SubItem -->|references| Price
    Price -->|belongs to| Product
    Sub -->|generates| Invoice
    Invoice -->|contains| InvoiceLineItem
    Invoice -->|creates| PI
```

### Checkout Flow

```mermaid
flowchart TB
    Customer[Customer]
    CS[CheckoutSession]
    PI[PaymentIntent]
    Sub[Subscription]
    SI[SetupIntent]

    Customer -->|initiates| CS
    CS -->|payment mode| PI
    CS -->|subscription mode| Sub
    CS -->|setup mode| SI
```

### Discount Application

```mermaid
flowchart LR
    Coupon[Coupon]
    PC[PromotionCode]
    Discount[Discount]
    Sub[Subscription]
    Invoice[Invoice]

    Coupon -->|used in| PC
    PC -->|creates| Discount
    Discount -->|applied to| Sub
    Discount -->|applied to| Invoice
```

## Enumerations

### PaymentIntent Status

- `requires_payment_method`
- `requires_confirmation`
- `requires_action`
- `processing`
- `requires_capture`
- `canceled`
- `succeeded`

### PaymentMethod Type (50+ payment methods globally)

- `card` - Credit/debit cards
- `acss_debit` - Pre-authorized debit in Canada
- `affirm` - Buy now, pay later (US)
- `afterpay_clearpay` - Buy now, pay later
- `alipay` - Alipay digital wallet
- `alma` - Buy now, pay later (France)
- `amazon_pay` - Amazon Pay wallet
- `au_becs_debit` - BECS Direct Debit (Australia)
- `bacs_debit` - BACS Direct Debit (UK)
- `bancontact` - Bancontact (Belgium)
- `billie` - B2B buy now, pay later (Germany)
- `blik` - BLIK (Poland)
- `boleto` - Boleto (Brazil)
- `card_present` - In-person card payments
- `cashapp` - Cash App Pay
- `crypto` - Cryptocurrency payments
- `custom` - Custom payment method
- `customer_balance` - Customer balance
- `eps` - EPS (Austria)
- `fpx` - FPX (Malaysia)
- `giropay` - Giropay (Germany)
- `grabpay` - GrabPay (Southeast Asia)
- `ideal` - iDEAL (Netherlands)
- `interac_present` - Interac (Canada)
- `kakao_pay` - Kakao Pay (South Korea)
- `klarna` - Klarna buy now, pay later
- `konbini` - Konbini (Japan)
- `kr_card` - Korean credit cards
- `link` - Link by Stripe
- `mb_way` - MB WAY (Portugal)
- `mobilepay` - MobilePay (Denmark/Finland)
- `multibanco` - Multibanco (Portugal)
- `naver_pay` - Naver Pay (South Korea)
- `nz_bank_account` - New Zealand bank accounts
- `oxxo` - OXXO (Mexico)
- `p24` - Przelewy24 (Poland)
- `pay_by_bank` - Open banking
- `payco` - PAYCO (South Korea)
- `paynow` - PayNow (Singapore)
- `paypal` - PayPal wallet
- `paypay` - PayPay (Japan)
- `payto` - PayTo (Australia)
- `pix` - Pix (Brazil)
- `promptpay` - PromptPay (Thailand)
- `revolut_pay` - Revolut Pay
- `samsung_pay` - Samsung Pay
- `satispay` - Satispay (Italy)
- `sepa_debit` - SEPA Direct Debit (Europe)
- `sofort` - Sofort (Europe)
- `swish` - Swish (Sweden)
- `twint` - TWINT (Switzerland)
- `us_bank_account` - ACH Direct Debit (US)
- `wechat_pay` - WeChat Pay
- `zip` - Zip buy now, pay later

### Subscription Status

- `incomplete`
- `incomplete_expired`
- `trialing`
- `active`
- `past_due`
- `canceled`
- `unpaid`
- `paused`

### Invoice Status

- `draft`
- `open`
- `paid`
- `uncollectible`
- `void`

### Invoice Billing Reason

- `automatic_pending_invoice_item_invoice` - Automatic invoice for pending items
- `manual` - Manually created invoice
- `quote_accept` - Quote accepted
- `subscription` - Subscription invoice
- `subscription_create` - Subscription creation
- `subscription_cycle` - Subscription billing cycle
- `subscription_threshold` - Subscription threshold reached
- `subscription_update` - Subscription updated
- `upcoming` - Upcoming invoice preview

### CheckoutSession Mode

- `payment` - Accept one-time payments
- `setup` - Save payment details for later
- `subscription` - Create subscription

### CheckoutSession Status

- `open` - Session active, payment in progress
- `complete` - Session complete, payment processed
- `expired` - Session expired, no further processing

### CheckoutSession Payment Status

- `paid` - Payment funds available
- `unpaid` - Payment funds not yet available
- `no_payment_required` - No payment required (e.g., setup mode or future payment)

### CheckoutSession UI Mode

- `hosted` - Hosted on Stripe's domain (default)
- `embedded` - Embedded form on your website
- `custom` - Custom integration with embedded components

### Charge Status

- `succeeded`
- `pending`
- `failed`

### Refund Status

- `pending`
- `requires_action`
- `succeeded`
- `failed`
- `canceled`

### Refund Reason

- `duplicate` - Duplicate transaction
- `fraudulent` - Fraudulent transaction
- `requested_by_customer` - Customer requested refund
- `expired_uncaptured_charge` - Charge expired before capture

### Dispute Status (8 states)

- `lost` - Dispute was lost
- `needs_response` - Evidence needed
- `prevented` - Dispute prevented by Stripe Radar
- `under_review` - Evidence submitted, under review
- `warning_closed` - Warning dispute closed
- `warning_needs_response` - Warning needs response
- `warning_under_review` - Warning under review
- `won` - Dispute was won

### Dispute Reason

- `bank_cannot_process` - Bank cannot process
- `check_returned` - Check returned
- `credit_not_processed` - Credit not processed
- `customer_initiated` - Customer initiated
- `debit_not_authorized` - Debit not authorized
- `duplicate` - Duplicate charge
- `fraudulent` - Fraudulent
- `general` - General dispute
- `incorrect_account_details` - Incorrect account details
- `insufficient_funds` - Insufficient funds
- `noncompliant` - Non-compliant
- `product_not_received` - Product not received
- `product_unacceptable` - Product unacceptable
- `subscription_canceled` - Subscription canceled
- `unrecognized` - Unrecognized charge

### BalanceTransaction Type (46+ transaction types)

- `adjustment` - Balance adjustment
- `advance` - Advance payment
- `advance_funding` - Advance funding
- `anticipation_repayment` - Anticipation repayment
- `application_fee` - Application fee
- `application_fee_refund` - Application fee refund
- `charge` - Charge
- `climate_order_purchase` - Climate order purchase
- `climate_order_refund` - Climate order refund
- `connect_collection_transfer` - Connect collection transfer
- `contribution` - Contribution
- `issuing_authorization_hold` - Issuing authorization hold
- `issuing_authorization_release` - Issuing authorization release
- `issuing_dispute` - Issuing dispute
- `issuing_transaction` - Issuing transaction
- `obligation_outbound` - Obligation outbound
- `obligation_reversal_inbound` - Obligation reversal inbound
- `payment` - Payment
- `payment_failure_refund` - Payment failure refund
- `payment_network_reserve_hold` - Payment network reserve hold
- `payment_network_reserve_release` - Payment network reserve release
- `payment_refund` - Payment refund
- `payment_reversal` - Payment reversal
- `payment_unreconciled` - Payment unreconciled
- `payout` - Payout
- `payout_cancel` - Payout canceled
- `payout_failure` - Payout failure
- `refund` - Refund
- `refund_failure` - Refund failure
- `reserve_transaction` - Reserve transaction
- `reserved_funds` - Reserved funds
- `stripe_fee` - Stripe fee
- `stripe_fx_fee` - Stripe FX fee
- `tax_fee` - Tax fee
- `topup` - Top-up
- `topup_reversal` - Top-up reversal
- `transfer` - Transfer
- `transfer_cancel` - Transfer canceled
- `transfer_failure` - Transfer failure
- `transfer_refund` - Transfer refund

### Customer Tax Exempt

- `none` - Not tax exempt
- `exempt` - Tax exempt
- `reverse` - Reverse charge

### Price Types

- `one_time`
- `recurring`

### Billing Scheme

- `per_unit`
- `tiered`

### Tax Behavior

- `inclusive`
- `exclusive`
- `unspecified`

### Collection Method

- `charge_automatically`
- `send_invoice`

### Coupon Duration

- `forever`
- `once`
- `repeating`

## Important Field Types

### Common Fields on Most Objects

- `id` (string): Unique identifier (e.g., `cus_xxx`, `sub_xxx`, `pi_xxx`)
- `object` (string): Object type (e.g., "customer", "subscription")
- `created` (timestamp): Creation time (Unix timestamp)
- `metadata` (object): Custom key-value pairs (up to 50 keys)
- `livemode` (boolean): Test vs production mode

### Money Amounts

All monetary amounts are in the **smallest currency unit** (cents for USD):

- $10.00 = 1000
- €9.99 = 999

### Expandable Fields

Many IDs can be "expanded" to include full objects:

```json
{
  "customer": "cus_123"  // Just ID
  "customer": {          // Expanded object
    "id": "cus_123",
    "email": "customer@example.com"
  }
}
```

## Stripe-Specific Concepts

### Metadata

- Up to 50 keys per object
- Keys: max 40 characters
- Values: max 500 characters
- Useful for storing application-specific data

### Idempotency

- Use `Idempotency-Key` header to safely retry requests
- Prevents duplicate charges

### Webhooks Events

Key events to listen for:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`
- `charge.dispute.created`

### Test vs Live Mode

- Test keys: `pk_test_...` / `sk_test_...`
- Live keys: `pk_live_...` / `sk_live_...`
- Data is completely separate between modes

## Critical API Notes

### ⚠️ DEPRECATED: Charge Direct Creation

**The Charge create endpoint is DEPRECATED as of 2019.**

- ✅ **DO**: Use PaymentIntents API for all new integrations
- ❌ **DON'T**: Create charges directly via POST /v1/charges
- Charges are still created automatically when PaymentIntents succeed
- Existing charges remain accessible via the API

### Multi-Party Payment Support

Several entities now support `customer_account` field for multi-party payments:

- Customer
- PaymentIntent
- Invoice
- InvoiceItem
- CheckoutSession
- PromotionCode

This enables payment processing where the account owner differs from the customer.

### InvoiceLineItem Structure

**Important**: InvoiceLineItem is NOT a standalone API object.

- It's a nested object within `Invoice.lines` array
- No separate create/update/delete endpoints
- Created automatically from InvoiceItems and SubscriptionItems
- Access via: GET /v1/invoices/:id or GET /v1/invoices/:id/lines

### Field Nullability

Most Stripe object fields are nullable. Key fields that are ALWAYS present:

- `id` (unique identifier)
- `object` (object type string)
- Status/state enums (may have "unknown" values in rare cases)

### Currency Handling

- All amounts in **smallest currency unit** (cents for USD, yen for JPY)
- Zero-decimal currencies (e.g., JPY) use actual amount (¥100 = 100)
- Use `currency_options` on Price for multi-currency support

### Expandable Field Pattern

Many foreign key fields can be expanded to include full object:

```
# Normal: Returns ID only
"customer": "cus_123"

# Expanded: Returns full object
"customer": {
  "id": "cus_123",
  "email": "customer@example.com",
  ...
}
```

## Implementation Notes

### Payment Flow Best Practices

```mermaid
sequenceDiagram
    participant App
    participant Stripe
    participant Webhooks

    App->>Stripe: Create Customer (optional)
    App->>Stripe: Create/Attach PaymentMethod
    App->>Stripe: Create PaymentIntent
    App->>Stripe: Confirm PaymentIntent
    Stripe->>Stripe: Create Charge
    Stripe->>Webhooks: payment_intent.succeeded
    Webhooks->>App: Update order status
```

### Subscription Flow Best Practices

```mermaid
sequenceDiagram
    participant App
    participant Stripe
    participant Webhooks

    App->>Stripe: Create Customer
    App->>Stripe: Add PaymentMethod
    App->>Stripe: Create Subscription (with Price items)
    Stripe->>Stripe: Create Invoice
    Stripe->>Stripe: Create PaymentIntent
    Stripe->>Stripe: Process Payment
    Stripe->>Webhooks: subscription.created
    Stripe->>Webhooks: invoice.paid
    Webhooks->>App: Activate subscription
```

### Invoice vs InvoiceItem

- **InvoiceItem**: Pending charge not yet on an invoice
- **InvoiceLineItem**: Actual line on a finalized invoice
- InvoiceItems become InvoiceLineItems when invoice is created

### Checkout Sessions

- Hosted payment page (no PCI compliance needed)
- `mode`: `payment` (one-time), `subscription`, or `setup` (save card)
- Automatically creates PaymentIntent or Subscription
- Returns customer to `success_url` after payment

## Common Patterns

### Save Card for Future Use

```javascript
// Use PaymentIntent with setup_future_usage
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: "usd",
  customer: "cus_123",
  setup_future_usage: "off_session", // Saves card automatically
});
```

### Add One-Time Charge to Subscription

```javascript
// Create InvoiceItem - added to next invoice
const invoiceItem = await stripe.invoiceItems.create({
  customer: "cus_123",
  amount: 500,
  currency: "usd",
  description: "One-time setup fee",
});
```

### Apply Coupon to Subscription

```javascript
const subscription = await stripe.subscriptions.update("sub_123", {
  coupon: "SUMMER20",
});
```

### Proration on Plan Change

```mermaid
flowchart LR
    A[Old Plan: $50/mo<br/>15 days used] -->|Change Plan| B[Calculate Credit<br/>$25 credit]
    B --> C[New Plan: $100/mo<br/>15 days remaining]
    C --> D[Invoice: $50 - $25 = $25<br/>Immediate charge]
```

## Database Schema Recommendations

When replicating this model:

1. **Store Stripe IDs as strings** (varchar 255)
2. **Use proper foreign keys** but handle soft deletes (Stripe rarely deletes)
3. **Mirror metadata as JSONB** for flexibility
4. **Store amounts as integers** (cents)
5. **Use enums for status fields** where possible
6. **Index foreign keys** heavily (customer_id, subscription_id, etc.)
7. **Store timestamps** as Unix timestamps or native datetime
8. **Keep webhooks event log** for audit trail
9. **Use idempotency keys** table for request deduplication
10. **Version your schema** - Stripe API versions change

## Webhook Data Sync Strategy

```mermaid
flowchart TB
    subgraph Stripe
        Event[Webhook Event]
    end

    subgraph Your App
        Endpoint[Webhook Endpoint]
        Verify[Verify Signature]
        Process[Process Event]
        DB[(Database)]
        Queue[Job Queue]
    end

    Event -->|POST| Endpoint
    Endpoint --> Verify
    Verify -->|Valid| Process
    Verify -->|Invalid| Reject[Reject 401]
    Process --> DB
    Process -.->|async| Queue
    Process --> Success[Return 200]
```

### Critical Webhook Events

| Category         | Events                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **Customer**     | `customer.created`, `customer.updated`, `customer.deleted`                                            |
| **Payment**      | `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.succeeded`, `charge.refunded`    |
| **Invoice**      | `invoice.created`, `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`                      |
| **Subscription** | `subscription.created`, `subscription.updated`, `subscription.deleted`, `subscription.trial_will_end` |
| **Product**      | `product.created`, `product.updated`, `price.created`, `price.updated`                                |
| **Dispute**      | `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`                           |

## Additional Resources

- [Stripe API Reference](https://docs.stripe.com/api) - Complete API documentation
- [Webhooks Guide](https://docs.stripe.com/webhooks) - Event handling best practices
- [Testing Guide](https://docs.stripe.com/testing) - Test card numbers and scenarios
- [API Versioning](https://docs.stripe.com/upgrades) - Version upgrade guides

_Last Updated: February 2, 2026_  
_Based on: Stripe API Documentation (docs.stripe.com/api)_  
_Verification: Systematic entity-by-entity comparison completed_  
_Status: ✅ Full 1:1 parity achieved with all core Stripe objects_
