# 🗄️ Database Models

This document outlines the core MongoDB data models used in the system, managed through **Prisma ORM**.  
The schema is designed for **Next.js + NextAuth.js + Stripe integration**, ensuring scalability, clarity, and full transactional traceability.

---

## 🧑‍💻 User & Account

**NextAuth.js integration for authentication**

- **User roles:** `USER`, `ADMIN`, `SUPER_ADMIN`
- OAuth account linking via the `Account` model
- Each user can have multiple linked accounts (e.g., Google, GitHub)
- Includes optional `stripeCustomerId` for linking users with Stripe Customers
- Cascade deletion ensures linked accounts are removed when a user is deleted

---

## 🛍️ Product

**Core product catalog**

- Links to **Stripe** via `stripeProductId`
- Supports **multiple images**
- Active/inactive toggle (`active`)
- **Soft deletion** via `deletedAt`
- Flexible **metadata** storage for custom attributes
- Indexed by `active` and `deletedAt` for efficient queries

---

## 💰 Price

**Product pricing** (one-to-many with Product)

- Links to **Stripe** via `stripePriceId`
- Supports both **ONE_TIME** and **RECURRING** pricing
- Stores all amounts **in cents**
- Handles **subscription intervals**, **trial periods**, and **billing frequency**
- Includes **soft deletion** (`deletedAt`)
- Connected to both **CartItems** and **OrderItems**
- Indexed by `productId`, `active`, and `deletedAt`

---

## 🛒 Cart & CartItem

**Shopping cart functionality**

- **Session-based** for guests (`sessionId`)
- **User-based** for authenticated users (`userId`)
- Tracks cart status via enum:  
  `ACTIVE`, `CHECKED_OUT`, `EXPIRED`
- Uses `expiresAt` for guest cart expiration (managed by MongoDB TTL index)
- Stores `lastActivityAt` for session tracking
- References specific **Product** and **Price**
- Prevents duplicate entries through a compound unique index on `(cartId, productId, priceId)`
- Cascade deletion ensures related items are removed when a cart is deleted

---

## 📦 Order & OrderItem

**Order processing and Stripe integration**

- Links to Stripe via `stripeCheckoutSessionId` and `stripePaymentIntentId`
- Complete order status workflow:  
  `PENDING → PROCESSING → COMPLETED / FAILED / CANCELLED / REFUNDED`
- Includes detailed **payment status**:
  - `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `REQUIRES_PAYMENT_METHOD`, `REQUIRES_CONFIRMATION`, `REQUIRES_ACTION`, `CANCELED`
- Includes **fulfillment status**:
  - `UNFULFILLED`, `FULFILLED`, `SHIPPED`, `DELIVERED`, `RETURNED`
- Stores **addresses**, **billing/shipping info**, and flexible **metadata**
- Captures **price at time of purchase** (`unitAmount`)
- Supports **partial and full refunds** (`refundedAmount`, `refundReason`)
- Indexed by user, customer email, order status, and creation date for efficient filtering and reporting

---

## 🔔 WebhookEvent

**Stripe webhook event tracking**

- Ensures idempotent processing via unique `stripeEventId`
- Tracks **processing status** (`processed`) and **error messages**
- Indexed for efficient event retries and chronological ordering
- Enables robust async event-driven architecture for Stripe sync

---

# ⚙️ Key Stripe Integration Points

- **Users** are linked to Stripe Customers via `stripeCustomerId`
- **Products** sync with Stripe Products
- **Prices** sync with Stripe Prices
- **Orders** are created from Stripe Checkout Sessions
- **Webhook events** drive asynchronous payment, refund, and fulfillment updates

---

# 🧱 Database Details

- **Database:** MongoDB
- **ORM:** Prisma
- Uses **ObjectId** for all primary keys
- Implements **cascade deletions** between related models (User → Account, Product → Price, Cart → CartItem, etc.)
- Supports **soft deletes** via `deletedAt`
- Uses **MongoDB TTL index** on `Cart.expiresAt` for automatic guest cart cleanup
- Indexed for performance and scalability across all major relational fields

---

# 🧩 Enums Overview

### UserRole

`USER`, `ADMIN`, `SUPER_ADMIN`

### PriceType

`ONE_TIME`, `RECURRING`

### CartStatus

`ACTIVE`, `CHECKED_OUT`, `EXPIRED`

### OrderStatus

`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`

### PaymentStatus

`PENDING`, `PAID`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `REQUIRES_PAYMENT_METHOD`, `REQUIRES_CONFIRMATION`, `REQUIRES_ACTION`, `CANCELED`

### FulfillmentStatus

`UNFULFILLED`, `FULFILLED`, `SHIPPED`, `DELIVERED`, `RETURNED`

---

# 🧾 Summary

This schema provides:

- **Full Stripe integration** with customer, product, and checkout session linkage
- **Secure authentication** and role-based access via NextAuth
- **Robust e-commerce structure** (Products, Prices, Carts, Orders)
- **Event-driven extensibility** through webhook tracking
- **Operational reliability** via soft deletes, indexes, and TTL expiration

---
