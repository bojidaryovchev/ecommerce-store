# Implementation Plan

> Ecommerce Store MVP — monorepo with Next.js, Drizzle/Neon Postgres, Stripe, Pulumi on AWS

---

## Architecture Overview

```
ecommerce-store/
├── apps/web          → Next.js 16 storefront + admin panel
├── packages/database → Drizzle ORM schema, validators, client (shared)
├── infra/            → Pulumi IaC (S3, Lambda, IAM, EventBridge)
└── docs/             → Reference documentation
```

| Layer     | Stack                                                               |
| --------- | ------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Server Components, `use cache`)             |
| Auth      | NextAuth v5 (Google OAuth, JWT, role-based: USER/ADMIN/SUPER_ADMIN) |
| Database  | Neon Postgres → Drizzle ORM, 40 tables, 42 enums                    |
| Payments  | Stripe (Checkout Sessions, webhooks, hosted mode)                   |
| Storage   | AWS S3 (presigned uploads, public read, orphan cleanup via Lambda)  |
| Infra     | Pulumi (TypeScript), Docker Compose for local dev                   |
| UI        | Tailwind CSS, Radix UI / shadcn, react-hook-form + Zod              |
| Monorepo  | pnpm workspaces, shared `@ecommerce/database` package               |

---

## What's Built

### Database (packages/database)

Full Stripe 1:1 parity — 25 Stripe entities mirrored with all fields, enums, and relations:

| Stripe Entity      | Table                 | Status |
| ------------------ | --------------------- | ------ |
| Customer           | `customer`            | ✅     |
| Product            | `product`             | ✅     |
| Price              | `price`               | ✅     |
| PaymentIntent      | `payment_intent`      | ✅     |
| Charge             | `charge`              | ✅     |
| PaymentMethod      | `payment_method`      | ✅     |
| Refund             | `refund`              | ✅     |
| Subscription       | `subscription`        | ✅     |
| SubscriptionItem   | `subscription_item`   | ✅     |
| Invoice            | `invoice`             | ✅     |
| InvoiceItem        | `invoice_item`        | ✅     |
| InvoiceLineItem    | `invoice_line_item`   | ✅     |
| Coupon             | `coupon`              | ✅     |
| PromotionCode      | `promotion_code`      | ✅     |
| Discount           | `discount`            | ✅     |
| CheckoutSession    | `checkout_session`    | ✅     |
| SetupIntent        | `setup_intent`        | ✅     |
| ShippingRate       | `shipping_rate`       | ✅     |
| TaxRate            | `tax_rate`            | ✅     |
| TaxId              | `tax_id`              | ✅     |
| BalanceTransaction | `balance_transaction` | ✅     |
| Dispute            | `dispute`             | ✅     |
| CreditNote         | `credit_note`         | ✅     |
| Quote              | `quote`               | ✅     |
| PaymentLink        | `payment_link`        | ✅     |

Ecommerce-specific tables:

| Table        | Purpose                           | Status |
| ------------ | --------------------------------- | ------ |
| `category`   | Product categories (hierarchical) | ✅     |
| `order`      | Customer orders                   | ✅     |
| `order_item` | Line items with product snapshots | ✅     |
| `cart`       | Shopping carts (guest + auth)     | ✅     |
| `cart_item`  | Cart line items                   | ✅     |
| `address`    | User shipping/billing addresses   | ✅     |
| `review`     | Product reviews with ratings      | ✅     |
| `wishlist`   | Saved products                    | ✅     |
| `upload`     | S3 upload lifecycle tracking      | ✅     |

Auth tables (NextAuth): `user`, `account`, `session`, `verificationToken`, `authenticator` — all ✅

Zod validators generated for every table + custom business-logic validators for products, categories, customers, prices, and Stripe webhook events.

### Storefront

| Feature          | Route                | Details                                                                  |
| ---------------- | -------------------- | ------------------------------------------------------------------------ |
| Home page        | `/`                  | Hero, 8 featured products, 4 featured categories                         |
| Product listing  | `/products`          | Grid of all active products with prices                                  |
| Product detail   | `/products/[id]`     | Image gallery, pricing, description, marketing features, reviews display |
| Category listing | `/categories`        | Grid of root categories                                                  |
| Category detail  | `/categories/[slug]` | Breadcrumbs, subcategories, filtered products                            |
| Order history    | `/orders`            | User's orders table with status badges, totals, item counts              |
| Order detail     | `/orders/[id]`       | Items, summary, addresses, timeline — auth-gated with ownership check    |
| Login            | `/login`             | Google OAuth sign-in, redirect if already authenticated                  |
| Checkout success | `/checkout/success`  | Order confirmation with items, totals, address, link to My Orders        |
| Checkout cancel  | `/checkout/cancel`   | Cancellation notice with navigation links                                |

- All pages are Server Components with Suspense/streaming and loading skeletons
- Static generation via `generateStaticParams` for products and categories
- Dynamic SEO metadata via `generateMetadata`

### Cart System

- Server-authoritative: DB is source of truth, React Context for client state
- Guest carts via `cart_session_id` httpOnly cookie (30-day expiry)
- Authenticated carts by `userId`
- Guest → user merge on login (additive quantities, then guest cart deleted)
- Slide-out cart sheet with item count badge on navbar
- Add / update quantity / remove / clear operations

### Checkout Flow

- `POST /api/checkout` → creates Stripe Checkout Session (hosted mode)
- Line items built from cart with `price_data` (name, images, unit_amount)
- Collects shipping (US, CA, GB, AU, DE, FR, NL, BE) and billing addresses
- `POST /api/webhooks/stripe` handles `checkout.session.completed`:
  - Creates order + order items with product/price snapshots
  - Extracts shipping/billing addresses
  - Clears the cart

### Admin Panel

Protected by middleware (ADMIN/SUPER_ADMIN roles only). Sidebar layout.

| Feature             | Routes                               | Operations                                  |
| ------------------- | ------------------------------------ | ------------------------------------------- |
| Dashboard           | `/admin`                             | Revenue, orders, pending, catalog stats     |
| Category management | `/admin/categories`, `/new`, `/[id]` | Create, edit, soft-delete                   |
| Product management  | `/admin/products`, `/new`, `/[id]`   | Create, edit, soft-delete, restore, pricing |
| Order management    | `/admin/orders`, `/[id]`             | View, status transitions, fulfillment       |
| Review moderation   | `/admin/reviews`                     | List, delete                                |
| Coupon management   | `/admin/coupons`, `/new`, `/[id]`    | Create, edit name, delete (cascade)         |
| Promotion codes     | `/admin/promotions`, `/new`          | Create, activate/deactivate, delete         |

- Data tables with confirmation dialogs
- react-hook-form + Zod validation
- Multi-image upload with S3 presigned URLs and drag-and-drop

### Image Upload System

- Presigned URL flow: `POST /api/upload/presigned-url` → client uploads to S3 → link on save
- Upload lifecycle: `pending` → `linked` (on save) or `deleted` (on cleanup/manual delete)
- `DELETE /api/upload/delete` for immediate removal
- Lambda-based orphan cleanup (daily at 3 AM UTC via EventBridge)
- Stats endpoint: `GET /api/upload/cleanup`

### Infrastructure (Pulumi)

| Resource            | Purpose                                     |
| ------------------- | ------------------------------------------- |
| S3 Bucket           | Product/category images (public read)       |
| IAM User + Policy   | App ↔ S3 access credentials                 |
| Lambda (Node.js 20) | Calls cleanup API to purge orphaned uploads |
| EventBridge Rule    | Daily cron trigger for cleanup Lambda       |
| CORS Configuration  | Allows uploads from app origin              |

Docker Compose: local Postgres 17 + Stripe CLI (webhook forwarding).

### Caching Strategy

- Queries use `"use cache"` + `cacheTag()` for cross-request caching
- Actions invalidate via `revalidateTag()` with `"max"` staleness
- Cart is explicitly uncached (user-specific, high mutation rate)
- Tags: `categories`, `category:{id}`, `category:slug:{slug}`, `products`, `product:{id}`, `orders`, `order:{id}`, `orders:user:{userId}`, `reviews`, `reviews:product:{id}`, `coupons`, `coupon:{id}`, `promotion-codes`, `promotion-code:{id}`

---

## What's Missing — Gap Analysis

### 🔴 Critical — Blocks a Usable MVP

| #     | Gap                             | Details                                                                                                         |
| ----- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ~~1~~ | ~~Customer order history~~      | ~~No `/orders` route~~ — ✅ **Done** (Phase 1.1)                                                                |
| ~~2~~ | ~~Admin order management~~      | ~~No `/admin/orders`~~ — ✅ **Done** (Phase 1.2)                                                                |
| ~~3~~ | ~~Admin dashboard is static~~   | ~~Placeholder cards~~ — ✅ **Done** (Phase 1.3)                                                                 |
| 4     | No search or filtering          | ~~No product search~~ (✅ Phase 2.1), ~~category filter, price sort~~ (✅ Phase 2.2) — discovery tools complete |
| ~~5~~ | ~~No inventory/stock tracking~~ | ~~No `stock_quantity` on products~~ — ✅ **Done** (Phase 3)                                                     |
| ~~6~~ | ~~No transactional emails~~     | ~~No order confirmation, no shipping notification, no welcome email~~ — ✅ **Done** (Phase 5)                   |

### 🟡 Important — Expected for a Credible MVP

| #      | Gap                             | Details                                                                                       |
| ------ | ------------------------------- | --------------------------------------------------------------------------------------------- |
| ~~7~~  | ~~No user account page~~        | ✅ Phase 4.1 — account layout, profile page, address CRUD                                     |
| 8      | ~~No pagination~~               | ✅ Phase 2.3 — all list queries paginated, reusable `Pagination` component applied to 5 pages |
| ~~9~~  | ~~Reviews are read-only~~       | ✅ Phase 6.1 — rating + text submission, purchase-gated, user self-delete, admin moderation   |
| 10     | Wishlist has no UI              | `wishlist` table exists, zero frontend                                                        |
| ~~11~~ | ~~No Stripe Customer sync~~     | ✅ Phase 4.2 — `getOrCreateStripeCustomer()` on checkout, synced to user row                  |
| 12     | Refund flow incomplete          | `refund` table exists, no admin UI or Stripe refund API integration                           |
| ~~13~~ | ~~Promo codes not in checkout~~ | ✅ Phase 6.2 — `allow_promotion_codes: true`, admin CRUD for coupons + promo codes            |

### 🟢 Nice-to-Have — Post-MVP

| #   | Gap                 | Details                                                 |
| --- | ------------------- | ------------------------------------------------------- |
| 14  | SEO metadata fields | No `metaTitle`/`metaDescription` on products/categories |
| 15  | Product variants    | No size/color/option system — products are flat         |
| 16  | Order audit trail   | No status change history or event log                   |
| 17  | Multi-currency      | `currency_options` jsonb exists on `price` but unused   |
| 18  | Shipping tracking   | Only timestamps on order, no carrier/tracking number    |
| 19  | Rate limiting       | No API abuse protection                                 |

---

## Implementation Plan

### Phase 1 — Complete the Purchase Loop

The core flow (browse → cart → pay → track) is broken after payment. Fix it.

**1.1 Customer Order History** ✅ Completed

- Route: `/orders` (list), `/orders/[id]` (detail)
- Queries used: `getOrdersByUserId`, `getOrderById` with `"use cache"` + `cacheTag()`
- Components: `OrderList` (table), `OrderDetail` (items/summary/addresses/timeline), `OrderStatusBadge` (7 statuses, color-coded), `OrderSummary` (totals breakdown), `AddressDisplay` (reusable)
- Skeletons: `OrdersListSkeleton`, `OrderDetailSkeleton`
- Navbar: "My Orders" in user dropdown (desktop + mobile)
- Auth: `/orders` protected by `proxy.ts` middleware + page-level `auth()` redirect
- Access control: `order.userId !== session.user.id` → `notFound()`
- Checkout success page: "View My Orders" link added
- Bug fixes applied:
  - Moved `CART_SESSION_COOKIE` from `"use server"` file to `@/lib/cart-utils.ts` (Next.js requires server files to only export async functions)
  - Moved `auth()` call inside `<Suspense>` boundary in root Providers to prevent blocking route rendering

**1.2 Admin Order Management** ✅ Completed

- Route: `/admin/orders` (list with status filters via search params), `/admin/orders/[id]` (detail + status actions)
- New query: `getAllOrders` with status filter, date range, limit/offset (`"use cache"` + `cacheTag()`)
- New type: `OrderWithItemsAndUser` extending `OrderWithItems` with user info
- Enhanced `getOrderById` to include `user` relation (benefits admin detail view)
- Components: `AdminOrdersHeader`, `OrdersTableLoader` (async server → client table), `OrdersTable` (status filter dropdown, customer info, totals), `AdminOrderDetail` (status update buttons with confirmation dialog)
- Status transitions: paid → processing → shipped → delivered, with cancel and refund actions where appropriate. Terminal states (cancelled, refunded) have no further transitions
- Admin sidebar: "Orders" link added between Dashboard and Categories
- Reuses existing `OrderStatusBadge`, `OrderSummary`, `AddressDisplay` components
- Wires existing `updateOrderStatus` server action with `useDisclosure` confirmation dialog pattern
- Loading/not-found pages follow established admin patterns

**1.3 Admin Dashboard** ✅ Completed

- Replaced static placeholder cards with real aggregated data
- New queries: `getDashboardStats` (parallel aggregations: order count/revenue all-time + 30 days, pending fulfillment, product/category counts), `getRecentOrders` (last 10 non-pending orders with user info)
- Components: `DashboardStatsCards` (4 metric cards with icons: revenue, orders, pending fulfillment, catalog), `DashboardRecentOrders` (recent orders table with status badges, customer info, "View All" link)
- `AdminDashboard` refactored from sync placeholder to async server component fetching data via `Promise.all`
- Admin page wrapped in `<Suspense>` with skeleton fallback
- Cache: uses existing `CACHE_TAGS.orders`, `CACHE_TAGS.products`, `CACHE_TAGS.categories` — auto-invalidated by existing mutations

### Phase 2 — Discovery & Browsing

**2.1 Product Search** ✅ Completed

- Search bar in navbar: `SearchBar` client component with 300ms inline debounce (`setTimeout` + `timerRef`), `useTransition` for non-blocking navigation, search icon + clear button
- Desktop: search bar inline in desktop nav (lg+) and right section (sm–lg). Mobile: inside sheet nav
- Navigates to `/products?q=term` on debounce and on form submit
- Syncs input with URL search params; clears when navigating away from `/products`
- New query: `searchProducts(query)` using ILIKE on `name` and `COALESCE(description, '')` for null-safe search, filters `active: true`, includes prices + category, uses `"use cache"` + `cacheTag()`
- New component: `SearchResults` async server component — fetches via `searchProducts`, renders `ProductsGrid` with contextual empty message
- `/products` page updated: accepts `searchParams`, conditionally renders `SearchResults` or `AllProducts`, Suspense `key={query}` for re-streaming on search change
- Heading dynamically shows `Search: "query"` with subtitle when searching

**2.2 Filtering & Sorting** ✅ Completed

- Unified query: `getFilteredProducts(filters)` accepts optional `query`, `categoryId`, `minPrice`, `maxPrice`, `sort` — replaces separate `getProducts` + `searchProducts` on the products page
- ILIKE search on name + description, category via `eq(categoryId)`, price range via correlated MIN subquery on active prices, 6 sort options (newest, oldest, price ↑↓, name A–Z/Z–A)
- `ProductFilters` client component: category Select, min/max price Inputs (dollars → cents on blur), sort Select, "Clear filters" button. All state driven by URL search params via `useTransition` + `router.push`
- `FilteredProducts` async server component: fetches via `getFilteredProducts`, renders `ProductsGrid` with contextual empty message
- `/products` page: parses all search params (`q`, `category`, `minPrice`, `maxPrice`, `sort`), validates sort against allowed set, fetches categories for filter dropdown, `Suspense key={JSON.stringify(filters)}` for re-streaming
- URL-based state: all filters are URL search params — shareable, bookmarkable, back/forward compatible
- Search bar in navbar + filter bar on page work together: `q` param preserved when toggling filters, "Clear filters" preserves active search

**2.3 Pagination** ✅ Completed

- Reusable `Pagination` client component with prev/next, first/last, page numbers with ellipsis, `useTransition` for non-blocking navigation, URL `?page=` param driven
- `PaginatedResult` type: `{ data, total, page, pageSize, pageCount }`
- All list queries updated: `getFilteredProducts` (12/page), `getAllProducts` (20/page), `getCategories` (20/page), `getRootCategories` (12/page), `getAllOrders` (20/page) — all return `PaginatedResult` with `COUNT(*)` totals
- Applied to: `/products`, `/categories`, `/admin/products`, `/admin/categories`, `/admin/orders`
- Suspense keys include page for re-streaming on page change
- Non-paginated callers (navbar, form dropdowns, featured, generateStaticParams) use large `pageSize` to fetch all

### Phase 3 — Inventory ✅ Completed

**3.1 Schema Changes** ✅ Completed

- Added to `product` table: `trackInventory` (boolean, default false, not null), `stockQuantity` (integer, nullable)
- Migration `0004_parched_rhodey.sql` generated and applied via `drizzle-kit push`

**3.2 Stock Logic** ✅ Completed

- **Admin product form**: "Inventory Management" section with `trackInventory` Switch toggle and conditional `stockQuantity` number Input (only shown when tracking enabled). Stock quantity resets to null when tracking is disabled
- **Admin products table**: STOCK column between CATEGORY and STATUS — shows "Out of Stock" (red badge) when 0/null, "Low: X" (amber badge) when ≤10, plain number otherwise, "—" when not tracking inventory
- **Product detail page**: Stock indicator badges after price — "Out of Stock" (destructive), "Low Stock — Only X left" (amber/warning), "In Stock" (green) — only displayed when `trackInventory` is true
- **Add-to-cart validation**: Server action checks `product.trackInventory` and `product.stockQuantity <= 0` → returns error "This product is out of stock". Add-to-cart button disabled with "Out of Stock" label when stock unavailable
- **Checkout validation**: `POST /api/checkout` validates each cart item's stock — checks `trackInventory` → `stockQuantity < item.quantity` → returns 400 with specific error including product name and available/requested quantities
- **Webhook stock decrement**: On `checkout.session.completed`, iterates cart items and decrements `stockQuantity` for products with `trackInventory && stockQuantity !== null` using `Math.max(0, current - quantity)`. Invalidates product cache tags for updated items

### Phase 4 — User Account

**4.1 Account Pages** ✅ Completed

- Route: `/account` (layout with sidebar nav), `/account/profile`, `/account/addresses`
- Profile: display name, email, avatar (read-only from Google OAuth)
- Addresses: full CRUD for shipping/billing using existing `address` table + validators
- Components: `AccountLayout` (sidebar + content), `ProfileView`, `AddressCard`, `AddressForm` (create/edit dialog with react-hook-form + Zod)
- Auth-gated: redirects to `/login` if not authenticated

**4.2 Stripe Customer Sync** ✅ Completed

- On first checkout: `getOrCreateStripeCustomer()` helper in checkout route looks up `stripeCustomerId` on the `user` row, creates a Stripe Customer via `stripe.customers.create()` if missing, and stores the ID back on the user
- Checkout Session uses `customer` param (instead of `customer_email`) for authenticated users — enables saved payment methods, Stripe-hosted customer portal, and richer Stripe Dashboard data
- Guest checkout falls back to `customer_email` as before
- Webhook safety net: `handleCheckoutSessionCompleted` syncs `session.customer` to the user row to guard against race conditions

### Phase 5 — Emails

**5.1 Email Service** ✅ Completed

- Integrated **Resend** (`resend@6.9.2`) with `@react-email/components` for templated transactional emails
- Created `src/lib/email.ts` — `sendEmail()` helper with lazy Resend client init. Gracefully skips if `RESEND_API_KEY` is not set (safe for local dev)
- Added `RESEND_API_KEY` and `EMAIL_FROM` to `environment.d.ts`
- Three React Email templates in `src/emails/`:
  - `OrderConfirmationEmail` — itemised receipt with subtotal/shipping/tax/total, shipping address
  - `OrderShippedEmail` — shipment notification with order ID
  - `WelcomeEmail` — first sign-in greeting

**5.2 Transactional Emails** ✅ Completed

- **Order confirmation** — sent in webhook `handleCheckoutSessionCompleted` after order + items are created, to customer email from Stripe session
- **Order shipped** — sent in `updateOrderStatus` mutation when status transitions to `shipped`, looks up user email via `getUserEmail()` helper or uses `guestEmail`
- **Welcome email** — sent in NextAuth `signIn` event when `isNewUser` is true, to the user's email

### Phase 6 — Feature Completeness

**6.1 Review Submission** ✅ Completed

- Action: `createReview` (rating 1–5, optional text body — no title field, keeping it simple for MVP)
- Gate: only users who have purchased the product can leave a review (verified via order items)
- One review per user per product — users can delete their own review to re-submit
- `ReviewSection` on product detail page with `ReviewForm` (star rating + textarea) and `ReviewList` (shows all reviews with delete button for own review)
- Admin: `/admin/reviews` — review moderation table with delete capability
- DB: dropped unused `title` column from `review` table via `drizzle-kit push`

**6.2 Promotion Codes** ✅ Completed

- Checkout: `allow_promotion_codes: true` on Stripe Checkout Session — enables promo code input on Stripe's hosted checkout page
- Admin coupon management (`/admin/coupons`): create (percent/amount off, duration, max redemptions), edit (name only — Stripe limitation), delete (cascade to promo codes)
- Admin promotion code management (`/admin/promotions`): create (code, coupon link, max redemptions, minimum amount, first-time-only), activate/deactivate toggle, delete (deactivates in Stripe)
- All operations sync to Stripe in real-time — coupons and promo codes exist in both DB and Stripe
- Stripe API: uses `promotion: { type: 'coupon', coupon: stripeCouponId }` for promo code creation (SDK v20.3.1)
- Cache: `coupons`, `coupon:{id}`, `promotion-codes`, `promotion-code:{id}` tags with proper invalidation
- See `docs/promotion-codes.md` for full documentation

**6.3 Wishlist** ✅ Completed

- Heart toggle on product cards and detail page
- Action: `toggleWishlist` using existing table
- Route: `/account/wishlist` — saved items grid
- Queries: `getWishlistByUserId`, `getWishlistProductIds`, `isProductWishlisted`
- WishlistButton client component (icon + labeled variants)
- Wired to all ProductsGrid callers (AllProducts, FilteredProducts, SearchResults, FeaturedProducts, CategoryLoader) and ProductLoader/ProductDetail
- Account sidebar updated with Wishlist nav item
- Cache tags: `wishlist:{userId}` with proper invalidation

**6.4 Refund Management** ✅ Completed

- Admin order detail: "Issue Refund" button on eligible statuses (paid, processing, shipped, delivered)
- RefundDialog component: full/partial refund toggle, amount input, reason select, validation against max refundable
- Server action `issueRefund`: calls `stripe.refunds.create()`, stores in `refund` table, auto-sets order to "refunded" on full refund
- Refund history section on admin order detail with status badges, amounts, dates, Stripe IDs
- Query `getRefundsByOrderId` with `"use cache"` + `cacheTag`
- `getOrderById` now includes `refunds` relation (ordered by created desc)
- `OrderWithItemsAndUser` type extended with optional `refunds` array
- Cache tags: `refundsByOrder:{orderId}` with proper invalidation
- Removed old simple "Refund Order" status transition from delivered → refunded

---

## File Naming & Conventions

> Full conventions documented in `apps/web/STYLEGUIDE.md`

| Type             | Pattern                           | Example                           |
| ---------------- | --------------------------------- | --------------------------------- |
| Component        | `kebab-case.component.tsx`        | `order-detail.component.tsx`      |
| Client component | `kebab-case-client.component.tsx` | `search-bar-client.component.tsx` |
| Server action    | `kebab-case.action.ts`            | `orders.action.ts`                |
| Query            | `kebab-case.ts` in `lib/queries/` | `orders.ts`                       |
| Type             | `kebab-case.type.ts`              | `order.type.ts`                   |
| Hook             | `use-kebab-case.ts`               | `use-disclosure.ts`               |

- Server Components by default; `"use client"` only when interactivity is required
- All server actions return `ActionResult<T>` (success/error discriminated union)
- Forms: react-hook-form + Zod + server actions + toast feedback
- Caching: `"use cache"` + `cacheTag()` in queries, `revalidateTag()` in actions
