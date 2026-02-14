# Promotion Codes & Coupons

How the discount system works — Stripe integration, data model, and admin management.

## Concepts

### Coupon

A **coupon** defines the discount rules:

- **Discount type**: percentage off (1–100%) or fixed amount off (in cents)
- **Duration**: `once` (single payment), `forever` (every future payment), `repeating` (N months)
- **Limits**: optional max redemptions and redeem-by date

Coupons are created in both **Stripe** and our **database** simultaneously. Only the `name` can be updated after creation — Stripe locks all other fields.

### Promotion Code

A **promotion code** is a customer-facing code (e.g. `SUMMER20`) linked to a coupon. It's what customers type at checkout.

One coupon can have **many** promotion codes, each with different restrictions:

```
Coupon: "Summer Sale" — 20% off, once
  ├── SUMMER20       (unlimited uses)
  ├── VIP20          (first-time customers only, max 50 uses)
  └── INFLUENCER20   (min $50 order, expires Dec 2026)
```

All three codes apply the same 20% discount but with different constraints.

### Duration (once vs forever vs repeating)

These Stripe duration values control how discounts apply across billing cycles:

| Duration    | Behavior                                  | Relevant for us?   |
| ----------- | ----------------------------------------- | ------------------ |
| `once`      | Discount applies to a single payment      | **Yes** — use this |
| `forever`   | Discount applies to every future payment  | Subscriptions only |
| `repeating` | Discount applies for N months, then stops | Subscriptions only |

Since our store uses **one-time payments** (`mode: "payment"` in Stripe Checkout), only `once` is practically meaningful. The other options are exposed in the admin UI for future-proofing but have no effect on single payments.

## Data Flow

```
Admin creates coupon          Admin creates promo code        Customer at checkout
       │                              │                              │
       ▼                              ▼                              ▼
stripe.coupons.create()       stripe.promotionCodes.create()  Stripe Checkout UI
       │                              │                       shows "Add promo code"
       ▼                              ▼                              │
   DB: coupons table            DB: promotion_codes table            ▼
                                   (couponId FK)              Stripe validates code,
                                                              applies discount
```

### Checkout Integration

The checkout route (`/api/checkout`) passes `allow_promotion_codes: true` to `stripe.checkout.sessions.create()`. This enables the promo code input field on the Stripe-hosted checkout page. Stripe handles all validation — we don't need to verify codes ourselves.

## Database Schema

### Coupons

| Column               | Type         | Notes                                               |
| -------------------- | ------------ | --------------------------------------------------- |
| `id`                 | text (PK)    | `crypto.randomUUID()`                               |
| `stripe_coupon_id`   | text         | Stripe's coupon ID                                  |
| `name`               | text         | Display name (only editable field)                  |
| `percent_off`        | numeric(5,2) | e.g. `20.00` — mutually exclusive with `amount_off` |
| `amount_off`         | integer      | In cents — mutually exclusive with `percent_off`    |
| `currency`           | text         | Required when using `amount_off`                    |
| `duration`           | enum         | `once` \| `forever` \| `repeating`                  |
| `duration_in_months` | integer      | Required when duration is `repeating`               |
| `max_redemptions`    | integer      | Optional global limit                               |
| `times_redeemed`     | integer      | Counter (updated by Stripe webhooks)                |
| `valid`              | boolean      | Whether the coupon is active                        |

### Promotion Codes

| Column                     | Type      | Notes                                                            |
| -------------------------- | --------- | ---------------------------------------------------------------- |
| `id`                       | text (PK) | `crypto.randomUUID()`                                            |
| `stripe_promotion_code_id` | text      | Stripe's promo code ID                                           |
| `code`                     | text      | Unique, uppercased (e.g. `SUMMER20`)                             |
| `coupon_id`                | text (FK) | References `coupon.id` (cascade delete)                          |
| `active`                   | boolean   | Toggle on/off without deleting                                   |
| `max_redemptions`          | integer   | Optional per-code limit                                          |
| `times_redeemed`           | integer   | Counter                                                          |
| `expires_at`               | timestamp | Optional expiry                                                  |
| `restrictions`             | jsonb     | `{ firstTimeTransaction, minimumAmount, minimumAmountCurrency }` |

**Relationship**: `promotion_codes.coupon_id` → `coupons.id` with cascade delete. Deleting a coupon removes all its promotion codes from both the database and Stripe.

## Stripe API Notes

### Creating Promotion Codes

The Stripe SDK (v20.3.1, API version `2026-01-28.clover`) uses a nested `promotion` parameter:

```typescript
await stripe.promotionCodes.create({
  promotion: {
    type: "coupon",
    coupon: stripeCouponId, // Stripe's coupon ID, not our DB ID
  },
  code: "SUMMER20",
  restrictions: {
    first_time_transaction: true,
    minimum_amount: 5000, // $50.00 in cents
    minimum_amount_currency: "usd",
  },
});
```

### Update Limitations

- **Coupons**: only `name` and `metadata` can be updated after creation
- **Promotion codes**: only `active` and `metadata` can be updated; codes cannot be deleted via the API, only deactivated

### Deletion Behavior

- **Coupon delete**: `stripe.coupons.del(id)` permanently deletes from Stripe. Our mutation also cascade-deletes promotion codes from the database and revalidates both cache tags
- **Promo code delete**: deactivates in Stripe (`active: false`), then deletes from our database

## Admin UI

### Coupons (`/admin/coupons`)

- **List**: table with name, discount, duration, redemptions, status (active/inactive), edit/delete actions
- **Create** (`/admin/coupons/new`): name, discount type toggle (percent/amount), value, currency (for amount), duration select, duration in months (for repeating), max redemptions
- **Edit** (`/admin/coupons/[id]`): only name can be changed — other fields are locked with an explanatory message
- **Delete**: confirmation dialog warning about cascade deletion of promotion codes

### Promotion Codes (`/admin/promotions`)

- **List**: table with code, linked coupon name, discount, redemptions, expiry, status, activate/deactivate toggle, delete
- **Create** (`/admin/promotions/new`): code (auto-uppercased), coupon select (shows name + discount + duration), max redemptions, minimum order amount, first-time-only checkbox
- No edit view — codes can only be toggled active/inactive from the list

## Cache Tags

| Tag                   | Used by                       | Invalidated by                                   |
| --------------------- | ----------------------------- | ------------------------------------------------ |
| `coupons`             | `getCoupons`, `getCouponById` | create, update, delete coupon                    |
| `coupon:{id}`         | `getCouponById`               | update, delete coupon                            |
| `promotion-codes`     | `getPromotionCodes`           | create, toggle, delete promo code; delete coupon |
| `promotion-code:{id}` | —                             | toggle, delete promo code                        |
