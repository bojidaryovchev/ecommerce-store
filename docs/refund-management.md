# Refund Management

> Admin-facing refund system for issuing full or partial refunds via Stripe

---

## Overview

The refund system allows admins to issue refunds directly from the order detail page in the admin panel. Refunds are processed through the Stripe API and the results are stored locally in the `refund` database table. The system supports both full and partial refunds, tracks refund history per order, and automatically updates order status when fully refunded.

---

## How Refunding Works (End-to-End)

### 1. Customer Places an Order

When a customer checks out, the following happens:

1. A **Stripe Checkout Session** is created, which collects the customer's payment details (card number, expiry, CVC).
2. Stripe creates a **PaymentIntent** behind the scenes — this represents the intent to charge the customer's card.
3. Once the customer confirms payment, Stripe charges the card and the PaymentIntent status becomes `succeeded`.
4. Our webhook receives the `checkout.session.completed` event, creates the **Order** in our database, and stores the `stripePaymentIntentId` on the order record.

At this point, the money has moved from the customer's card → their bank → Stripe → our Stripe balance (minus Stripe's fees).

### 2. Admin Issues a Refund

From `/admin/orders/[id]`, an admin clicks **"Issue Refund"** and chooses:

- **Full Refund** — refunds the entire remaining refundable amount
- **Partial Refund** — refunds a specific dollar amount
- **Reason** (optional) — `requested_by_customer`, `duplicate`, or `fraudulent`

### 3. What Happens Behind the Scenes

```
Admin clicks "Refund $49.99"
         │
         ▼
┌─────────────────────────┐
│  issueRefund() action   │  (server action, requires admin auth)
│                         │
│  1. Validate order      │  - Order exists, has stripePaymentIntentId
│     exists & is         │  - Status is not "cancelled"
│     refundable          │  - Amount > 0 and ≤ max refundable
│                         │
│  2. Calculate max       │  - totalAmount - sum(existing refunds)
│     refundable amount   │  - Prevents over-refunding
│                         │
│  3. Call Stripe API     │  stripe.refunds.create({
│                         │    payment_intent: "pi_xxx",
│                         │    amount: 4999,  // in cents
│                         │    reason: "requested_by_customer"
│                         │  })
│                         │
│  4. Store refund record │  Insert into `refund` table with
│     in our database     │  stripeRefundId, amount, status, etc.
│                         │
│  5. Auto-update order   │  If totalRefunded >= totalAmount,
│     status if fully     │  set order.status = "refunded"
│     refunded            │
│                         │
│  6. Invalidate caches   │  orders, order:{id}, refundsByOrder:{id}
└─────────────────────────┘
```

### 4. What Happens on Stripe's Side

When `stripe.refunds.create()` is called:

1. **Stripe reverses the charge** on the original PaymentIntent. It doesn't create a new transaction — it reverses the original one.
2. **The refund goes back to the original payment method** (e.g., the same card the customer used to pay). You cannot refund to a different card.
3. **Timeline for the customer:**
   - **Credit/debit cards**: The refund appears on the customer's statement within **5–10 business days**, depending on their bank. Some banks show a pending credit immediately.
   - The customer may see a line item like "REFUND - [Your Business Name]" on their statement.
4. **Stripe's fees**: Stripe does **not** refund its processing fees (typically 2.9% + 30¢). So if the original charge was $100, Stripe keeps ~$3.20 in fees, and $100 is returned to the customer. The $3.20 comes out of your Stripe balance.
5. **Refund status**: Most refunds succeed immediately and have status `succeeded`. In rare cases (e.g., the customer's bank requires additional verification), the status may be `pending` or `requires_action`.

### 5. What the Customer Sees

- The customer does **not** receive an automatic email from our app about the refund (though Stripe can be configured to send refund receipts).
- The refund appears on their card statement within 5–10 business days.
- If the customer views their order on our site, the order status will show as "Refunded" (if fully refunded).

---

## Eligible Statuses for Refund

| Order Status | Can Refund? | Notes                                     |
| ------------ | ----------- | ----------------------------------------- |
| `pending`    | No          | No payment has been made yet              |
| `paid`       | **Yes**     | Payment captured, can refund immediately  |
| `processing` | **Yes**     | Order is being prepared, still refundable |
| `shipped`    | **Yes**     | In transit, still refundable              |
| `delivered`  | **Yes**     | Delivered, common refund scenario         |
| `cancelled`  | No          | Cancelled orders cannot be refunded       |
| `refunded`   | No          | Already fully refunded                    |

Additionally, the order must have a `stripePaymentIntentId` — orders without one (e.g., test/manual orders) cannot be refunded through Stripe.

---

## Partial Refunds

The system fully supports partial refunds:

- An admin can refund any amount between $0.01 and the remaining refundable balance.
- Multiple partial refunds can be issued on the same order.
- The system tracks `totalRefunded` as the sum of all `succeeded` and `pending` refunds.
- The "Issue Refund" button disappears once `totalRefunded >= totalAmount`.
- The order status only changes to `refunded` when the full amount has been refunded.

**Example:**

1. Order total: $100.00
2. First refund: $30.00 → Order stays at current status, $70.00 remaining
3. Second refund: $70.00 → Order auto-transitions to `refunded` status

---

## Refund Reasons

| Value                   | Label                 | When to Use                        |
| ----------------------- | --------------------- | ---------------------------------- |
| `requested_by_customer` | Requested by customer | Customer asked for a return/refund |
| `duplicate`             | Duplicate charge      | Customer was charged twice         |
| `fraudulent`            | Fraudulent            | Suspected fraudulent transaction   |

The reason is optional and is passed to Stripe for their records. It also appears in the refund history on the admin order detail page.

---

## Architecture

### Files

| File                                                                | Purpose                                                               |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `mutations/refunds/issue-refund.mutation.ts`                        | Server action — validates, calls Stripe, stores record, updates order |
| `queries/refunds/get-refunds-by-order-id.query.ts`                  | Cached query for refund history                                       |
| `components/admin/orders/refund-dialog/refund-dialog.tsx`           | Client component — full/partial toggle, amount input, reason select   |
| `components/admin/orders/admin-order-detail/admin-order-detail.tsx` | Integrates refund button, dialog, and refund history display          |
| `lib/cache-tags.ts`                                                 | `refundsByOrder(orderId)` cache tag                                   |
| `queries/orders/get-order-by-id.query.ts`                           | Now includes `refunds` relation                                       |
| `queries/orders/index.ts`                                           | `OrderWithItemsAndUser` type extended with `refunds[]`                |

### Database

The `refund` table mirrors Stripe's Refund object:

| Column           | Type              | Description                                                                     |
| ---------------- | ----------------- | ------------------------------------------------------------------------------- |
| `id`             | text (PK)         | Local UUID                                                                      |
| `stripeRefundId` | text (unique)     | Stripe's `re_xxx` ID                                                            |
| `orderId`        | text (FK → order) | Which order this refund belongs to                                              |
| `amount`         | integer           | Refund amount in cents                                                          |
| `currency`       | text              | e.g., "usd"                                                                     |
| `status`         | enum              | `pending`, `succeeded`, `failed`, `canceled`, `requires_action`                 |
| `reason`         | enum              | `requested_by_customer`, `duplicate`, `fraudulent`, `expired_uncaptured_charge` |
| `created`        | timestamp         | When Stripe created the refund                                                  |

### Cache Invalidation

When a refund is issued, the following cache tags are invalidated:

- `orders` — the global orders list (admin view)
- `order:{orderId}` — the specific order detail
- `refunds-order:{orderId}` — the refund history for this order
- `orders-user:{userId}` — the customer's order list (if they're a registered user)

---

## Error Handling

The `issueRefund` action handles several error cases:

| Scenario                 | Error Message                                                  |
| ------------------------ | -------------------------------------------------------------- |
| Order not found          | "Order not found"                                              |
| No Stripe PaymentIntent  | "Order has no associated payment — cannot refund"              |
| Cancelled order          | "Cannot refund a cancelled order"                              |
| Amount ≤ 0               | "Refund amount must be greater than zero"                      |
| Amount exceeds remaining | "Refund amount exceeds maximum refundable amount of $X.XX USD" |
| Stripe API error         | Stripe's error message is forwarded                            |
| Unexpected error         | "Failed to issue refund"                                       |

All errors are shown to the admin as toast notifications. The refund dialog stays open on error so the admin can retry.

---

## Testing with Stripe Test Mode

When running in Stripe test mode (`sk_test_...`), refunds work identically to production but no real money moves. Use Stripe's test card numbers:

| Card                  | Scenario                         |
| --------------------- | -------------------------------- |
| `4242 4242 4242 4242` | Succeeds — refund will succeed   |
| `4000 0000 0000 0002` | Card declined — refund will fail |

After issuing a test refund, you can verify it in the [Stripe Dashboard](https://dashboard.stripe.com/test/payments) under the relevant PaymentIntent → Refunds section.
