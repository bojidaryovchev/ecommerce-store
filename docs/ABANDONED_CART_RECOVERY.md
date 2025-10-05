# Abandoned Cart Recovery System

> **Feature 7 of 8** - Automated email recovery system for abandoned shopping carts with analytics, admin management, and exit-intent capture.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Core Components](#core-components)
- [Email Strategy](#email-strategy)
- [Recovery Flow](#recovery-flow)
- [Exit-Intent Modal](#exit-intent-modal)
- [Admin Dashboard](#admin-dashboard)
- [Analytics & Reporting](#analytics--reporting)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing Guide](#testing-guide)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)
- [Best Practices](#best-practices)

---

## Overview

The Abandoned Cart Recovery system automatically detects when customers leave items in their cart and sends timely email reminders to encourage completion of their purchase. The system includes:

- **Automated Detection**: Hourly cron job identifies abandoned carts
- **3-Series Email Strategy**: Gentle reminder → Urgency → Discount offer
- **Token-Based Recovery**: Secure one-click cart restoration
- **Exit-Intent Capture**: Proactive email collection before abandonment
- **Admin Management**: Full dashboard with filters, actions, and export
- **Analytics Integration**: Track recovery rates, conversion, and revenue

### Key Features

✅ **Automated Detection** - Configurable thresholds and minimum values  
✅ **Smart Email Timing** - 1hr, 24hr, 72hr reminder intervals  
✅ **Guest Cart Support** - Recover carts without user accounts  
✅ **Cart Merging** - Seamless merge with existing cart for logged-in users  
✅ **Recovery Analytics** - Track funnel, rates, and revenue  
✅ **Exit-Intent Modal** - Capture emails before users leave  
✅ **Manual Actions** - Admin can send emails, cleanup, and export data

---

## Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CART ABANDONMENT                            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
           ┌────────▼────────┐          ┌────────▼────────┐
           │  Guest User     │          │  Logged-in User │
           │  with Items     │          │  with Items     │
           └────────┬────────┘          └────────┬────────┘
                    │                             │
                    │ (Exit Intent)               │ (Inactivity)
                    │                             │
           ┌────────▼────────┐          ┌────────▼────────┐
           │  Save Modal     │          │  Cart Updated   │
           │  Captures Email │          │  trackUpdates   │
           └────────┬────────┘          └────────┬────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   │ (1+ hours of inactivity)
                                   │
                    ┌──────────────▼──────────────┐
                    │    AUTOMATED DETECTION      │
                    │  (EventBridge + Lambda)     │
                    │   Runs Every Hour           │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Detection Criteria Check   │
                    │  • updatedAt > threshold    │
                    │  • itemCount > 0            │
                    │  • cartTotal > minimum      │
                    │  • has email                │
                    │  • not recovered            │
                    │  • reminders < max          │
                    └──────────────┬──────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │  Mark as Abandoned│
                         │  • Generate token │
                         │  • 7-day expiry   │
                         │  • Store snapshot │
                         └─────────┬─────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   REMINDER SCHEDULING       │
                    │  Reminder 1: 1 hour         │
                    │  Reminder 2: 24 hours       │
                    │  Reminder 3: 72 hours       │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   EMAIL GENERATION          │
                    │  • HTML + Plain Text        │
                    │  • Cart items with images   │
                    │  • Recovery link with token │
                    │  • Discount (final email)   │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    AWS SES DELIVERY         │
                    │  From: noreply@domain.com   │
                    │  Subject: Dynamic based on # │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    CUSTOMER RECEIVES        │
                    │    📧 Recovery Email        │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   CUSTOMER CLICKS LINK      │
                    │   /cart/recover/[token]     │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   TOKEN VALIDATION          │
                    │  • Check expiration         │
                    │  • Check already recovered  │
                    │  • Load cart snapshot       │
                    └──────────────┬──────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │   CART RECOVERY   │
                         │  • Restore items  │
                         │  • Merge if needed│
                         │  • Mark recovered │
                         │  • Track channel  │
                         └─────────┬─────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   REDIRECT TO CART          │
                    │   ✅ Success Message        │
                    │   → /cart                   │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   CHECKOUT & ORDER          │
                    │  • Mark order created       │
                    │  • Link orderId             │
                    │  • Calculate revenue        │
                    └─────────────────────────────┘
```

### Infrastructure Components

```
┌──────────────────────────────────────────────────────────────────┐
│                          AWS INFRASTRUCTURE                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐         ┌─────────────────┐                 │
│  │  EventBridge   │────────▶│  Lambda         │                 │
│  │  Schedule      │         │  Function       │                 │
│  │  rate(1 hour)  │         │  (Node.js 20)   │                 │
│  └────────────────┘         └────────┬────────┘                 │
│                                      │                           │
│                                      │ Triggers                  │
│                                      │                           │
│                       ┌──────────────▼──────────────┐            │
│                       │  Next.js API Route          │            │
│                       │  /api/cron/abandoned-carts  │            │
│                       │  (CRON_SECRET validation)   │            │
│                       └──────────────┬──────────────┘            │
│                                      │                           │
│                                      │ Queries                   │
│                                      │                           │
│  ┌───────────────────────────────────▼──────────────────────┐   │
│  │              PostgreSQL Database (Prisma)                │   │
│  │  • Cart table (with abandonedAt, updatedAt)              │   │
│  │  • AbandonedCart table (tokens, stats, recovery data)    │   │
│  │  • User table (for guest cart linking)                   │   │
│  └───────────────────────────────────┬──────────────────────┘   │
│                                      │                           │
│                                      │ Send Emails               │
│                                      │                           │
│  ┌───────────────────────────────────▼──────────────────────┐   │
│  │                      AWS SES v2                          │   │
│  │  • SendEmailCommand with HTML + Text                     │   │
│  │  • Auto-region detection from Lambda                     │   │
│  │  • Verified sender identities                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### AbandonedCart Model

```prisma
model AbandonedCart {
  id                String    @id @default(cuid())
  cartId            String    @unique
  cart              Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)

  // Customer Information
  userEmail         String
  userName          String?

  // Cart Snapshot
  itemCount         Int
  cartTotal         Decimal   @db.Decimal(10, 2)
  itemsSnapshot     Json      // Store cart items at time of abandonment

  // Recovery Token
  recoveryToken     String    @unique @default(cuid())
  tokenExpiresAt    DateTime  // 7 days from creation

  // Reminder Tracking
  remindersSent     Int       @default(0) // 0-3
  lastReminderSent  DateTime?

  // Recovery Status
  isRecovered       Boolean   @default(false)
  recoveredAt       DateTime?
  orderCreated      Boolean   @default(false)
  orderId           String?

  // Analytics
  recoveryChannel   String?   // "email" | "direct_link"

  // Timestamps
  abandonedAt       DateTime  @default(now())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Indexes for performance
  @@index([userEmail])
  @@index([recoveryToken])
  @@index([isRecovered])
  @@index([abandonedAt])
  @@index([tokenExpiresAt])
  @@index([remindersSent])
}
```

### Cart Model Extension

```prisma
model Cart {
  // ... existing fields
  abandonedAt     DateTime?
  abandonedCart   AbandonedCart?
}
```

### Migration

```bash
npx prisma migrate dev --name add_abandoned_cart_model
```

---

## Core Components

### 1. Detection Utility (`src/lib/abandoned-cart-detector.ts`)

**Purpose**: Core business logic for cart abandonment detection and recovery.

**Key Functions**:

- `detectAbandonedCarts(config)` - Find carts meeting abandonment criteria
- `markCartAsAbandoned(cart)` - Create AbandonedCart record with token
- `getAbandonedCartByToken(token)` - Retrieve and validate recovery token
- `markCartAsRecovered(id, orderId, channel)` - Update recovery status
- `getRecoveryStats(startDate, endDate)` - Calculate analytics metrics

**Default Configuration**:

```typescript
const DEFAULT_ABANDONMENT_CONFIG = {
  abandonmentThreshold: 60, // 1 hour in minutes
  minCartValue: 10, // Minimum $10 cart value
  maxReminders: 3, // Up to 3 reminder emails
  reminderIntervals: [1, 24, 72], // Hours: 1hr, 24hr, 72hr
};
```

**Detection Criteria**:

```typescript
// Cart is considered abandoned if:
1. updatedAt < (now - threshold) // Inactive for specified time
2. items.length > 0 // Has items in cart
3. user?.email exists // Has email for contact
4. !abandonedCart?.isRecovered // Not already recovered
5. cartTotal >= minCartValue // Meets minimum value
6. remindersSent < maxReminders // Haven't hit reminder limit
7. Time elapsed > next reminder interval // Ready for next reminder
```

### 2. Server Actions (`src/actions/abandoned-cart.action.ts`)

**Admin Actions**:

- `getAbandonedCarts(filters)` - List with status/date/value filtering
- `detectAndMarkAbandonedCarts(config)` - Manual detection trigger
- `sendRecoveryEmail(id)` - Send individual recovery email
- `cleanupOldAbandonedCarts(daysOld)` - Delete old records

**Public Actions**:

- `recoverCart(token)` - Public recovery endpoint (no auth required)
- `getAbandonedCartStats(dateRange)` - Analytics data

**Cart Merge Logic**:

```typescript
// When logged-in user recovers cart:
1. Load recovery cart items
2. Find user's existing cart
3. For each item:
   - If exists in current cart: use max quantity
   - If doesn't exist: add to current cart
4. Delete recovery cart
5. Mark as recovered
```

### 3. Cron Job (`src/app/api/cron/abandoned-carts/route.ts`)

**Endpoint**: `POST /api/cron/abandoned-carts`

**Security**:

- Validates `CRON_SECRET` from Authorization header
- Validates `x-amz-source: aws:events` from EventBridge

**Process Flow**:

```typescript
1. Detect abandoned carts with config
2. For each candidate cart:
   a. Mark as abandoned (create record + token)
   b. Map cart items to email format
   c. Generate HTML + plain text email
   d. Send via AWS SES
   e. Track success/errors
3. Return processing stats
```

**Response Format**:

```json
{
  "success": true,
  "processed": 5,
  "emailsSent": 4,
  "errors": 1,
  "results": [
    {
      "cartId": "clx...",
      "email": "customer@example.com",
      "reminderNumber": 1,
      "success": true
    }
  ]
}
```

### 4. Lambda Function (`src/functions/abandoned-cart-cron.ts`)

**Purpose**: Trigger Next.js cron endpoint from AWS EventBridge.

**Configuration**:

```typescript
// sst.config.ts
const abandonedCartCron = new Function(stack, "AbandonedCartCron", {
  handler: "src/functions/abandoned-cart-cron.handler",
  timeout: "5 minutes",
  environment: {
    NEXT_APP_URL: nextApp.url,
    CRON_SECRET: process.env.CRON_SECRET,
  },
});

new Schedule(stack, "AbandonedCartSchedule", {
  schedule: "rate(1 hour)",
  target: abandonedCartCron,
});
```

### 5. Save Cart Email Action (`src/actions/save-cart-email.action.ts`)

**Purpose**: Capture guest email via exit-intent modal.

**Process**:

```typescript
1. Validate email format
2. Get cart from session cookie
3. Check cart exists and has items
4. Store email in secure cookie
5. Create/find user record
6. Link cart to user
7. Enable abandoned cart recovery
```

---

## Email Strategy

### 3-Series Email Campaign

| Reminder | Timing   | Strategy               | Content                               | Conversion Goal |
| -------- | -------- | ---------------------- | ------------------------------------- | --------------- |
| **1**    | 1 hour   | Gentle reminder        | "You left something behind"           | Convenience     |
| **2**    | 24 hours | Urgency + Social proof | "Still interested? Others are buying" | FOMO            |
| **3**    | 72 hours | Last chance + Discount | "Final reminder + X% OFF"             | Incentive       |

### Email Components

**Template Functions** (`src/lib/email-templates/abandoned-cart-email.tsx`):

- `generateAbandonedCartEmailHTML(data)` - Responsive HTML email
- `generateAbandonedCartEmailText(data)` - Plain text alternative
- `getAbandonedCartEmailSubject(reminderNumber, discountCode, discountAmount)` - Dynamic subjects

**Email Data Structure**:

```typescript
interface AbandonedCartEmailData {
  customerName: string;
  cartItems: Array<{
    name: string;
    variantName?: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  cartTotal: number;
  recoveryUrl: string;
  reminderNumber: 1 | 2 | 3;
  discountCode?: string;
  discountAmount?: number;
}
```

### Subject Lines

```typescript
// Reminder 1
"Don't forget your items! 🛒";

// Reminder 2
"Still interested in your cart?";

// Reminder 3 (with discount)
"Last chance! Save 10% on your cart 🎁";

// Reminder 3 (without discount)
"Final reminder about your cart";
```

### Email Features

✅ **Responsive Design** - Mobile-friendly layout  
✅ **Product Images** - Visual cart item reminder  
✅ **Cart Summary** - Itemized list with totals  
✅ **One-Click Recovery** - Direct link with token  
✅ **Discount Codes** - Automatic application on recovery  
✅ **Unsubscribe Option** - CAN-SPAM compliance  
✅ **Support Contact** - Help link included

---

## Recovery Flow

### Public Recovery Route (`/cart/recover/[token]`)

**States**:

1. **Loading** - Initial validation

   ```tsx
   <Loader2 className="animate-spin" />;
   ("Restoring Your Cart...");
   ```

2. **Success** - Cart recovered

   ```tsx
   <CheckCircle className="text-green-600" />
   "Cart Restored Successfully!"
   → Auto-redirect to /cart after 2 seconds
   → Toast: "Welcome back! Your cart is ready."
   ```

3. **Expired** - Token past 7-day expiry

   ```tsx
   <AlertTriangle className="text-orange-600" />
   "Recovery Link Expired"
   → Explanation: Tokens valid for 7 days
   → CTA: Continue Shopping | Contact Support
   ```

4. **Already Recovered** - One-time use security

   ```tsx
   <Info className="text-blue-600" />
   "Cart Already Recovered"
   → Explanation: Security measure
   → CTA: View Cart | Continue Shopping
   ```

5. **Error** - Generic failure
   ```tsx
   <XCircle className="text-red-600" />
   "Unable to Recover Cart"
   → CTA: Try Again | Contact Support
   ```

### Recovery Logic

```typescript
async function recoverCart(token: string) {
  // 1. Validate token
  const abandonedCart = await getAbandonedCartByToken(token);
  if (!abandonedCart) return { error: "expired" };
  if (abandonedCart.isRecovered) return { error: "already-recovered" };

  // 2. Get current session/user
  const session = await getServerSession();

  // 3. Restore cart items
  if (session?.user) {
    // Merge with existing cart
    await mergeCartItems(abandonedCart, session.user.id);
  } else {
    // Restore guest cart
    await restoreGuestCart(abandonedCart);
  }

  // 4. Mark as recovered
  await markCartAsRecovered(
    abandonedCart.id,
    null, // orderId added later during checkout
    "email", // recovery channel
  );

  return { success: true };
}
```

---

## Exit-Intent Modal

### Purpose

Proactively capture guest emails **before** cart abandonment occurs.

### Components

**Modal Component** (`src/components/cart-save-modal.tsx`):

```tsx
<CartSaveModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSave={async (email) => await saveCartEmail(email)}
  itemCount={5}
  cartTotal={129.99}
/>
```

**Exit Intent Hook** (`src/hooks/use-exit-intent.ts`):

```typescript
const { shouldShow, reset } = useExitIntent({
  threshold: 20, // Pixels from top
  delay: 1000, // 1 second delay
  enabled: !session && itemCount > 0, // Guest users only
});
```

### Detection Logic

```typescript
// Triggers when:
1. User moves mouse to top 20px of screen (typical exit behavior)
2. 1-second delay to prevent accidental triggers
3. Only for guest users with items in cart
4. Shows once per session
5. Can be dismissed or email saved
```

### Integration (Cart Page)

```typescript
// src/app/cart/page.tsx
const CartPage = () => {
  const { data: session } = useSession();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  const shouldEnableExitIntent =
    !session && itemCount > 0 && !hasShownModal;

  const { shouldShow, reset } = useExitIntent({
    enabled: shouldEnableExitIntent,
  });

  useEffect(() => {
    if (shouldShow && !hasShownModal) {
      setShowSaveModal(true);
      setHasShownModal(true);
      reset();
    }
  }, [shouldShow, hasShownModal, reset]);

  const handleSaveCart = async (email: string) => {
    const result = await saveCartEmail(email);
    if (result.success) {
      toast.success("Cart saved! We'll remind you if you forget.");
      setShowSaveModal(false);
    }
  };

  return (
    <>
      {/* Cart UI */}
      <CartSaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveCart}
        itemCount={itemCount}
        cartTotal={total}
      />
    </>
  );
};
```

### Benefits

- **Proactive Prevention** - Catch abandonment before it happens
- **Guest Conversion** - Enable recovery for non-account users
- **Higher Recovery Rates** - Early email capture improves reach
- **Non-Intrusive** - Natural exit behavior triggers modal
- **Optional** - Users can skip if desired

---

## Admin Dashboard

### Route: `/admin/abandoned-carts`

### Features

**KPI Cards**:

```typescript
1. Total Abandoned - Count of all abandoned carts
2. Recovery Rate - Percentage recovered (recovered / total)
3. Conversion Rate - Orders created (orders / recovered)
4. Revenue Recovered - Total revenue from recovered orders
```

**Filters**:

- **Status**: All | Pending | Recovered
- **Date Range**: 7 days | 30 days | 90 days
- **Value Range**: $0-50 | $50-100 | $100-200 | $200+

**Data Table Columns**:

| Column    | Display           | Sort | Filter |
| --------- | ----------------- | ---- | ------ |
| Customer  | Name + Email      | ✅   | ❌     |
| Items     | Count             | ✅   | ❌     |
| Total     | Currency          | ✅   | ✅     |
| Reminders | 0-3 Badges        | ✅   | ❌     |
| Status    | Recovered/Pending | ✅   | ✅     |
| Abandoned | Relative time     | ✅   | ✅     |
| Actions   | Send Email button | ❌   | ❌     |

**Reminder Badges**:

```tsx
// Color-coded reminder count
0 reminders → Gray badge
1 reminder → Blue badge
2 reminders → Yellow badge
3 reminders → Red badge
```

**Actions**:

1. **Detect Now** - Manual `detectAndMarkAbandonedCarts()`
2. **Refresh** - Reload data
3. **Export CSV** - Download all filtered carts
4. **Cleanup Old** - Delete records older than 90 days
5. **Send Email** - Manual recovery email per cart

**Export CSV Format**:

```csv
Email,Name,Items,Total,Reminders,Status,Abandoned,Recovered
customer@example.com,John Doe,3,$129.99,1,Pending,2 hours ago,
another@example.com,Jane Smith,5,$249.99,2,Recovered,1 day ago,2024-10-05T10:30:00Z
```

---

## Analytics & Reporting

### Integration Location

**Main Analytics Dashboard** → **"Abandoned Carts" Tab**

### Metrics Component (`src/components/admin/analytics-abandoned-cart-insights.tsx`)

**4 Metric Cards**:

```typescript
1. Total Abandoned Carts
   - Count of all abandoned carts in date range
   - Icon: ShoppingCart

2. Recovery Rate
   - (Recovered / Total) × 100%
   - Icon: TrendingUp
   - Color: Green if > 30%, Yellow if < 30%

3. Conversion Rate
   - (Orders Created / Recovered) × 100%
   - Icon: CheckCircle
   - Color: Green if > 50%, Yellow if < 50%

4. Revenue Recovered
   - Sum of order totals from recovered carts
   - Icon: DollarSign
   - Format: Currency
```

**Recovery Funnel Visualization**:

```
Stage 1: Abandoned (100%)
  ├─ Total abandoned carts
  └─ Progress bar: Full width

Stage 2: Recovered (X%)
  ├─ Carts that were recovered
  ├─ Percentage of abandoned
  └─ Progress bar: Proportional

Stage 3: Orders Created (Y%)
  ├─ Recovered carts that became orders
  ├─ Percentage of recovered
  └─ Progress bar: Proportional
```

**Recovery Channels**:

```typescript
Email Recovery: X carts (Z%)
  - Clicked recovery link from email
  - Progress bar with blue color

Direct Link: Y carts (W%)
  - Used link directly (shared, bookmark, etc.)
  - Progress bar with purple color
```

**Key Insights**:

```typescript
// Smart recommendations based on data
if (recoveryRate < 30%) {
  "⚠️ Recovery rate is below 30%. Consider:\n" +
  "• Testing different email subject lines\n" +
  "• Offering larger discounts\n" +
  "• Shortening reminder intervals"
}

if (conversionRate < 50%) {
  "💡 Many recovered carts don't convert. Try:\n" +
  "• Simplifying checkout process\n" +
  "• Offering free shipping\n" +
  "• Adding urgency messaging"
}

// Always shown
"📊 Track recovery performance over time\n" +
"🎯 Focus on high-value abandoned carts\n" +
"✉️ Test different email strategies"
```

### Analytics Query

```typescript
// Get all stats for date range
const stats = await getAbandonedCartStats(startDate, endDate);

// Returns:
{
  totalAbandoned: 150,
  recovered: 45,
  recoveryRate: 30.0,
  ordersCreated: 30,
  conversionRate: 66.67,
  revenueRecovered: 3250.00,
  averageCartValue: 108.33,
  averageRecoveredValue: 72.22,
  channels: {
    email: 35,
    direct_link: 10
  }
}
```

---

## Configuration

### Settings Page Route: `/admin/settings/abandoned-carts`

### Configurable Options

**Detection Settings**:

```typescript
{
  abandonmentThreshold: number; // Hours (min 0.25 = 15 min)
  minCartValue: number; // Dollars (min 0)
}
```

**Email Settings**:

```typescript
{
  emailEnabled: boolean;
  maxReminders: 1 | 2 | 3 | 4 | 5;
  reminderSchedule: number[]; // Hours for each reminder
}
```

**Discount Settings**:

```typescript
{
  discountEnabled: boolean;
  discountCode: string; // Uppercase code
  discountAmount: number; // Percentage 1-100
}
```

### Storage

**Current**: `localStorage` (demo/development)

```typescript
const STORAGE_KEY = "abandoned-cart-config";

// Save
localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

// Load
const config = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
```

**Production**: Should use database table or environment variables

```prisma
// Recommended production approach
model SystemConfig {
  id    String @id @default(cuid())
  key   String @unique
  value Json
}

// Example:
key: "abandoned_cart_config"
value: { abandonmentThreshold: 60, ... }
```

### UI Features

- **Live Preview** - Shows formatted configuration summary
- **Validation** - Min/max checks on all inputs
- **Reset to Defaults** - Restore original settings
- **Change Detection** - Save button disabled until modified
- **Info Banner** - Explains localStorage vs database storage

### Default Configuration

```typescript
{
  abandonmentThreshold: 1, // 1 hour
  minCartValue: 10, // $10
  emailEnabled: true,
  maxReminders: 3,
  reminderSchedule: [1, 24, 72], // 1hr, 24hr, 72hr
  discountEnabled: true,
  discountCode: "COMEBACK10",
  discountAmount: 10 // 10%
}
```

---

## API Reference

### Detection Functions

#### `detectAbandonedCarts(config)`

Find carts matching abandonment criteria.

**Parameters**:

```typescript
config: {
  abandonmentThreshold: number; // Minutes
  minCartValue: number;
  maxReminders: number;
  reminderIntervals: number[]; // Hours
}
```

**Returns**: `Array<CartWithDetails>`

**Example**:

```typescript
const carts = await detectAbandonedCarts({
  abandonmentThreshold: 60,
  minCartValue: 10,
  maxReminders: 3,
  reminderIntervals: [1, 24, 72],
});
```

#### `markCartAsAbandoned(cart)`

Create AbandonedCart record with recovery token.

**Parameters**: `Cart` object

**Returns**: `AbandonedCart`

**Side Effects**:

- Generates unique recovery token (cuid)
- Sets 7-day expiration
- Stores cart items snapshot
- Creates database record

#### `getAbandonedCartByToken(token)`

Retrieve abandoned cart for recovery.

**Parameters**: `token: string`

**Returns**: `AbandonedCart | null`

**Validation**:

- Token exists
- Not expired (tokenExpiresAt > now)
- Not already recovered

#### `markCartAsRecovered(id, orderId?, channel?)`

Update recovery status.

**Parameters**:

```typescript
id: string; // AbandonedCart ID
orderId?: string; // Order ID if checkout completed
channel?: "email" | "direct_link";
```

**Updates**:

- `isRecovered = true`
- `recoveredAt = now`
- `orderCreated = !!orderId`
- `orderId = orderId`
- `recoveryChannel = channel`

#### `getRecoveryStats(startDate, endDate)`

Calculate analytics metrics.

**Parameters**:

```typescript
startDate: Date;
endDate: Date;
```

**Returns**:

```typescript
{
  totalAbandoned: number;
  recovered: number;
  recoveryRate: number;
  ordersCreated: number;
  conversionRate: number;
  revenueRecovered: number;
  averageCartValue: number;
  averageRecoveredValue: number;
  channels: {
    email: number;
    direct_link: number;
  }
}
```

### Server Actions

#### `getAbandonedCarts(filters)`

Get filtered list for admin dashboard.

**Parameters**:

```typescript
{
  status?: "all" | "pending" | "recovered";
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
}
```

**Returns**: `Array<AbandonedCart>`

#### `detectAndMarkAbandonedCarts(config?)`

Manual detection trigger.

**Parameters**: Optional config (uses defaults if not provided)

**Returns**: `{ success: boolean; count: number }`

#### `sendRecoveryEmail(abandonedCartId)`

Send individual recovery email.

**Parameters**: `abandonedCartId: string`

**Returns**: `{ success: boolean; error?: string }`

**Side Effects**:

- Increments `remindersSent`
- Updates `lastReminderSent`
- Sends email via AWS SES

#### `recoverCart(token)`

Public cart recovery endpoint.

**Parameters**: `token: string`

**Returns**:

```typescript
{
  success: boolean;
  error?: "expired" | "already-recovered" | "invalid";
  redirectUrl?: string;
}
```

#### `getAbandonedCartStats(startDate, endDate)`

Get analytics data.

**Parameters**: Date range

**Returns**: Stats object (see `getRecoveryStats`)

#### `cleanupOldAbandonedCarts(daysOld)`

Delete old records.

**Parameters**: `daysOld: number` (default: 90)

**Returns**: `{ success: boolean; deleted: number }`

#### `saveCartEmail(email)`

Capture guest cart email (exit-intent).

**Parameters**: `email: string`

**Returns**: `{ success: boolean; error?: string }`

**Side Effects**:

- Validates email format
- Creates/finds user record
- Links cart to user
- Stores email in secure cookie

---

## Testing Guide

### End-to-End Testing Checklist

#### 1. Cart Abandonment Detection

**Test Case 1.1: Guest Cart Abandonment**

```
1. ✅ Open incognito browser
2. ✅ Add 3 products to cart (total > $10)
3. ✅ Leave site without checking out
4. ✅ Wait 1+ hours
5. ✅ Trigger cron: POST /api/cron/abandoned-carts
6. ✅ Verify AbandonedCart record created
7. ✅ Verify recoveryToken generated
8. ✅ Verify tokenExpiresAt = now + 7 days
```

**Test Case 1.2: Logged-in Cart Abandonment**

```
1. ✅ Login with test account
2. ✅ Add 5 products to cart (total > $50)
3. ✅ Leave site without checking out
4. ✅ Wait 1+ hours
5. ✅ Trigger cron
6. ✅ Verify detection works
7. ✅ Verify email linked to user account
```

**Test Case 1.3: Below Minimum Value**

```
1. ✅ Add item with price < $10 to cart
2. ✅ Wait 1+ hours
3. ✅ Trigger cron
4. ✅ Verify NOT marked as abandoned (below threshold)
```

**Test Case 1.4: Empty Cart**

```
1. ✅ Create cart with 0 items
2. ✅ Wait 1+ hours
3. ✅ Trigger cron
4. ✅ Verify NOT marked as abandoned (no items)
```

#### 2. Email Sending

**Test Case 2.1: First Reminder (1 hour)**

```
1. ✅ Create abandoned cart (remindersSent = 0)
2. ✅ Set lastReminderSent = now - 1 hour
3. ✅ Trigger cron
4. ✅ Check AWS SES logs for email sent
5. ✅ Verify email received in inbox
6. ✅ Verify subject: "Don't forget your items! 🛒"
7. ✅ Verify cart items displayed with images
8. ✅ Verify recovery link present
9. ✅ Verify remindersSent = 1
```

**Test Case 2.2: Second Reminder (24 hours)**

```
1. ✅ Set remindersSent = 1
2. ✅ Set lastReminderSent = now - 24 hours
3. ✅ Trigger cron
4. ✅ Verify second email sent
5. ✅ Verify subject includes urgency
6. ✅ Verify remindersSent = 2
```

**Test Case 2.3: Final Reminder with Discount (72 hours)**

```
1. ✅ Set remindersSent = 2
2. ✅ Set lastReminderSent = now - 72 hours
3. ✅ Configure discount: COMEBACK10, 10%
4. ✅ Trigger cron
5. ✅ Verify third email sent
6. ✅ Verify subject includes discount
7. ✅ Verify discount code in email body
8. ✅ Verify remindersSent = 3
```

**Test Case 2.4: Max Reminders Reached**

```
1. ✅ Set remindersSent = 3
2. ✅ Trigger cron
3. ✅ Verify NO email sent (max reached)
```

#### 3. Recovery Flow

**Test Case 3.1: Successful Recovery (Guest)**

```
1. ✅ Get recovery email
2. ✅ Click recovery link
3. ✅ Verify redirect to /cart/recover/[token]
4. ✅ Verify "Restoring Your Cart..." loading state
5. ✅ Verify cart items restored to session
6. ✅ Verify auto-redirect to /cart after 2s
7. ✅ Verify toast: "Welcome back! Your cart is ready."
8. ✅ Verify isRecovered = true in database
9. ✅ Verify recoveryChannel = "email"
```

**Test Case 3.2: Recovery with Cart Merge (Logged-in)**

```
1. ✅ Login to account
2. ✅ Add 2 items to current cart
3. ✅ Click recovery link (cart has 3 items)
4. ✅ Verify items merged (total 5 items)
5. ✅ Verify quantities combined if duplicate items
6. ✅ Verify recovered cart deleted
7. ✅ Verify recovery marked in database
```

**Test Case 3.3: Expired Token**

```
1. ✅ Create abandoned cart
2. ✅ Set tokenExpiresAt = now - 1 day
3. ✅ Click recovery link
4. ✅ Verify "Recovery Link Expired" message
5. ✅ Verify CTAs: Continue Shopping | Contact Support
6. ✅ Verify cart NOT restored
```

**Test Case 3.4: Already Recovered**

```
1. ✅ Set isRecovered = true
2. ✅ Click recovery link
3. ✅ Verify "Cart Already Recovered" message
4. ✅ Verify explanation about one-time use
5. ✅ Verify cart NOT restored again
```

**Test Case 3.5: Invalid Token**

```
1. ✅ Use fake token URL
2. ✅ Verify "Unable to Recover Cart" error
3. ✅ Verify CTAs displayed
```

#### 4. Exit-Intent Modal

**Test Case 4.1: Guest Cart Exit Intent**

```
1. ✅ Open incognito browser
2. ✅ Add items to cart (3+ items)
3. ✅ Navigate to /cart
4. ✅ Move mouse to top of screen (< 20px from top)
5. ✅ Wait 1 second
6. ✅ Verify modal appears: "Don't lose your cart!"
7. ✅ Verify cart summary displayed
8. ✅ Verify email input field
```

**Test Case 4.2: Email Capture Success**

```
1. ✅ Trigger exit-intent modal
2. ✅ Enter valid email
3. ✅ Click "Save Cart"
4. ✅ Verify success toast
5. ✅ Verify modal closes
6. ✅ Verify email saved to cart record
7. ✅ Verify guest user created/linked
8. ✅ Verify recovery emails will be sent
```

**Test Case 4.3: Skip Email Capture**

```
1. ✅ Trigger modal
2. ✅ Click "No thanks, I'll remember"
3. ✅ Verify modal closes
4. ✅ Verify cart not linked to email
```

**Test Case 4.4: Logged-in User (No Modal)**

```
1. ✅ Login to account
2. ✅ Add items to cart
3. ✅ Move mouse to top of screen
4. ✅ Verify modal does NOT appear
```

**Test Case 4.5: Single Trigger Per Session**

```
1. ✅ Trigger modal as guest
2. ✅ Close/skip modal
3. ✅ Move mouse to top again
4. ✅ Verify modal does NOT reappear
```

#### 5. Admin Dashboard

**Test Case 5.1: View Abandoned Carts**

```
1. ✅ Navigate to /admin/abandoned-carts
2. ✅ Verify KPI cards display correct values
3. ✅ Verify table shows all abandoned carts
4. ✅ Verify reminder badges color-coded
5. ✅ Verify sort by columns works
```

**Test Case 5.2: Filter by Status**

```
1. ✅ Select "Pending" filter
2. ✅ Verify only pending carts shown
3. ✅ Select "Recovered" filter
4. ✅ Verify only recovered carts shown
```

**Test Case 5.3: Manual Detection**

```
1. ✅ Click "Detect Now" button
2. ✅ Verify loading state
3. ✅ Verify success toast with count
4. ✅ Verify table refreshes
```

**Test Case 5.4: Manual Send Email**

```
1. ✅ Click "Send Email" on cart row
2. ✅ Verify confirmation dialog
3. ✅ Confirm send
4. ✅ Verify email sent via SES
5. ✅ Verify remindersSent incremented
6. ✅ Verify success toast
```

**Test Case 5.5: Export CSV**

```
1. ✅ Apply filters
2. ✅ Click "Export CSV"
3. ✅ Verify file downloads
4. ✅ Verify CSV contains filtered data
5. ✅ Verify correct format
```

**Test Case 5.6: Cleanup Old Records**

```
1. ✅ Click "Cleanup Old"
2. ✅ Verify confirmation dialog (90 days)
3. ✅ Confirm cleanup
4. ✅ Verify old records deleted
5. ✅ Verify success toast with count
```

#### 6. Analytics Integration

**Test Case 6.1: View Analytics Tab**

```
1. ✅ Navigate to /admin/analytics
2. ✅ Click "Abandoned Carts" tab
3. ✅ Verify 4 metric cards render
4. ✅ Verify recovery funnel displays
5. ✅ Verify channel breakdown shows
6. ✅ Verify key insights appear
```

**Test Case 6.2: Date Range Filtering**

```
1. ✅ Select "Last 7 Days"
2. ✅ Verify metrics update
3. ✅ Select "Last 30 Days"
4. ✅ Verify metrics recalculate
```

**Test Case 6.3: Smart Recommendations**

```
1. ✅ Create scenario: recovery rate < 30%
2. ✅ Verify warning insight appears
3. ✅ Create scenario: conversion rate < 50%
4. ✅ Verify recommendation displays
```

#### 7. Configuration

**Test Case 7.1: Update Settings**

```
1. ✅ Navigate to /admin/settings/abandoned-carts
2. ✅ Change abandonment threshold to 2 hours
3. ✅ Change max reminders to 2
4. ✅ Click "Save Changes"
5. ✅ Verify success toast
6. ✅ Verify preview updates
7. ✅ Verify settings persist on reload
```

**Test Case 7.2: Reset to Defaults**

```
1. ✅ Modify multiple settings
2. ✅ Click "Reset to Defaults"
3. ✅ Verify all settings return to defaults
4. ✅ Verify preview updates
```

**Test Case 7.3: Validation**

```
1. ✅ Try setting threshold < 0.25 hours
2. ✅ Verify validation error
3. ✅ Try setting discount > 100%
4. ✅ Verify validation error
```

#### 8. Checkout Integration

**Test Case 8.1: Order Creation After Recovery**

```
1. ✅ Recover abandoned cart
2. ✅ Complete checkout
3. ✅ Verify orderCreated = true
4. ✅ Verify orderId linked
5. ✅ Verify revenue tracked in analytics
```

---

## Security

### Authentication & Authorization

**Public Endpoints** (No auth required):

- `POST /cart/recover/[token]` - Token-based security

**Admin Endpoints** (Requires ADMIN role):

- `/admin/abandoned-carts` - Dashboard
- `/admin/analytics` - Analytics
- `/admin/settings/abandoned-carts` - Configuration

**Cron Endpoint** (API key required):

- `POST /api/cron/abandoned-carts` - CRON_SECRET validation

### Token Security

**Recovery Tokens**:

- Generated with `cuid()` (cryptographically unique)
- 7-day expiration enforced
- One-time use only
- Cannot be reused after recovery

**CRON_SECRET**:

```bash
# Generate secure secret
node scripts/generate-cron-secret.mjs

# Add to .env
CRON_SECRET=abc123...
```

### Data Protection

**Sensitive Data**:

- Customer emails encrypted at rest
- Cart snapshots stored as JSON (no PII)
- Recovery tokens indexed but not exposed

**Cookie Security**:

```typescript
{
  httpOnly: true, // No JavaScript access
  secure: process.env.NODE_ENV === "production", // HTTPS only
  sameSite: "lax", // CSRF protection
  maxAge: 60 * 60 * 24 * 30, // 30 days
}
```

### Email Security

**AWS SES Configuration**:

- Sender identity verification required
- DKIM/SPF configuration recommended
- Bounce/complaint tracking enabled

**Email Content**:

- No sensitive data in email body
- Recovery links use tokens (not cart IDs)
- Unsubscribe option included

---

## Troubleshooting

### Common Issues

#### Issue 1: Cron Not Running

**Symptoms**: No emails sent, no new abandoned carts

**Diagnosis**:

```bash
# Check EventBridge rule
aws events list-rules --name-prefix AbandonedCart

# Check Lambda logs
aws logs tail /aws/lambda/AbandonedCartCron --follow

# Test endpoint manually
curl -X POST https://your-domain.com/api/cron/abandoned-carts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Solutions**:

1. Verify EventBridge schedule enabled
2. Check Lambda execution role permissions
3. Verify CRON_SECRET in environment
4. Check Next.js API route deployment

#### Issue 2: Emails Not Sending

**Symptoms**: Cron runs but no emails received

**Diagnosis**:

```typescript
// Check SES logs
const { data } = await sesClient.send(new SendEmailCommand(...));
console.log("Message ID:", data.MessageId);

// Check email verification
aws ses list-identities
aws ses get-identity-verification-attributes --identities your@email.com
```

**Solutions**:

1. Verify sender email in AWS SES
2. Check SES sandbox mode (production domains only)
3. Verify recipient email not bounced/complained
4. Check AWS region configuration
5. Review CloudWatch logs for errors

#### Issue 3: Token Expired Immediately

**Symptoms**: Recovery always shows "expired"

**Diagnosis**:

```typescript
// Check token creation
const cart = await prisma.abandonedCart.findUnique({
  where: { recoveryToken: token },
  select: { tokenExpiresAt: true, createdAt: true },
});

console.log("Created:", cart.createdAt);
console.log("Expires:", cart.tokenExpiresAt);
console.log("Now:", new Date());
```

**Solutions**:

1. Verify server timezone configuration
2. Check database timezone settings
3. Ensure `tokenExpiresAt = now + 7 days` logic correct

#### Issue 4: Cart Not Restored

**Symptoms**: Recovery succeeds but cart empty

**Diagnosis**:

```typescript
// Check items snapshot
const cart = await prisma.abandonedCart.findUnique({
  where: { recoveryToken: token },
  select: { itemsSnapshot: true },
});

console.log("Items:", cart.itemsSnapshot);
```

**Solutions**:

1. Verify `itemsSnapshot` stored correctly during abandonment
2. Check cart restoration logic
3. Ensure product IDs still valid (not deleted)
4. Verify variant availability

#### Issue 5: Exit-Intent Modal Not Showing

**Symptoms**: Modal never triggers on cart page

**Diagnosis**:

```typescript
// Add debug logs
const shouldEnableExitIntent = !session && itemCount > 0;
console.log("Enable exit intent:", shouldEnableExitIntent);
console.log("Session:", session);
console.log("Item count:", itemCount);

const { shouldShow } = useExitIntent({ enabled: true });
console.log("Should show:", shouldShow);
```

**Solutions**:

1. Verify user is guest (not logged in)
2. Ensure cart has items
3. Check `hasShownModal` state not stuck true
4. Verify mouse event listeners attached
5. Test with different browser/incognito

#### Issue 6: Duplicate Abandoned Carts

**Symptoms**: Multiple records for same cart

**Diagnosis**:

```sql
-- Check for duplicates
SELECT "cartId", COUNT(*)
FROM "AbandonedCart"
GROUP BY "cartId"
HAVING COUNT(*) > 1;
```

**Solutions**:

1. Use `upsert` instead of `create` in markCartAsAbandoned
2. Ensure unique constraint on cartId
3. Add idempotency checks in cron

#### Issue 7: High AWS Costs

**Symptoms**: Unexpected SES charges

**Diagnosis**:

```bash
# Check email volume
aws cloudwatch get-metric-statistics \
  --namespace AWS/SES \
  --metric-name Send \
  --dimensions Name=ses:account,Value=YourAccount \
  --start-time 2024-10-01T00:00:00Z \
  --end-time 2024-10-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

**Solutions**:

1. Increase minimum cart value threshold
2. Reduce max reminders from 3 to 2
3. Lengthen reminder intervals
4. Add email volume limits per hour
5. Implement unsubscribe tracking

---

## Cost Estimation

### AWS SES Costs

**Pricing** (as of 2024):

- First 1,000 emails/month: **FREE**
- Additional emails: **$0.10 per 1,000**

**Example Scenarios**:

| Monthly Abandoned Carts | Avg Reminders | Total Emails | Cost  |
| ----------------------- | ------------- | ------------ | ----- |
| 100                     | 2             | 200          | $0.00 |
| 500                     | 2             | 1,000        | $0.00 |
| 1,000                   | 2             | 2,000        | $0.10 |
| 5,000                   | 3             | 15,000       | $1.40 |
| 10,000                  | 3             | 30,000       | $2.90 |

### Lambda Costs

**Pricing**:

- First 1M requests/month: **FREE**
- First 400,000 GB-seconds: **FREE**
- Additional: **$0.20 per 1M requests**

**Cron Function**:

- Runs every hour: 720 executions/month
- Avg duration: 5 seconds
- Memory: 512 MB
- **Cost**: $0.00 (within free tier)

### EventBridge Costs

**Pricing**:

- First 1M events/month: **FREE**
- Scheduled rules: **FREE**

**Cost**: $0.00

### Total Estimated Costs

| Abandoned Carts/Month | Total Cost |
| --------------------- | ---------- |
| 0 - 500               | **$0.00**  |
| 1,000                 | **$0.10**  |
| 5,000                 | **$1.40**  |
| 10,000                | **$2.90**  |
| 50,000                | **$14.90** |

**Conclusion**: Extremely cost-effective for most e-commerce stores.

---

## Best Practices

### 1. Email Timing

✅ **Do**:

- Start with gentle reminder at 1 hour
- Space reminders at least 24 hours apart
- Save discount for final reminder
- Test different intervals for your audience

❌ **Don't**:

- Send more than 3 reminders
- Send reminders too frequently (annoying)
- Use same messaging for all reminders
- Send emails immediately after abandonment

### 2. Email Content

✅ **Do**:

- Include product images and names
- Show cart total prominently
- Use clear CTAs ("Return to Cart")
- Personalize with customer name
- Test subject lines regularly

❌ **Don't**:

- Use generic "Your Cart" subjects
- Omit unsubscribe option
- Make emails text-only (include HTML)
- Use overly salesy language

### 3. Discount Strategy

✅ **Do**:

- Reserve discounts for final reminder
- Test different discount amounts (5-20%)
- Make codes easy to remember
- Auto-apply codes when possible
- Track discount ROI

❌ **Don't**:

- Offer discount in first email (trains customers to wait)
- Use complex discount codes
- Offer same discount to all customers
- Forget to create Stripe coupon code

### 4. Detection Configuration

✅ **Do**:

- Start with 1-hour threshold, adjust based on data
- Set minimum cart value to filter low-value carts
- Monitor recovery rates and adjust settings
- Test different configurations

❌ **Don't**:

- Set threshold too short (< 30 minutes)
- Send reminders for very low cart values
- Use same config for all customer segments
- Ignore analytics when tuning

### 5. Recovery Experience

✅ **Do**:

- Make recovery one-click (token in URL)
- Show clear success message
- Auto-redirect to cart
- Merge items if user has existing cart
- Handle edge cases gracefully

❌ **Don't**:

- Require login for recovery
- Show error for expired tokens without explanation
- Allow token reuse (security risk)
- Lose cart items during merge

### 6. Analytics & Optimization

✅ **Do**:

- Track recovery rate, conversion rate, revenue
- Monitor by reminder number (which is most effective?)
- A/B test email subject lines
- Review admin dashboard weekly
- Export data for deeper analysis

❌ **Don't**:

- Ignore low recovery rates
- Assume all reminders equally effective
- Stop testing once "good enough"
- Forget to track ROI

### 7. Privacy & Compliance

✅ **Do**:

- Include unsubscribe option in all emails
- Respect unsubscribe requests immediately
- Store only necessary customer data
- Comply with GDPR/CAN-SPAM
- Provide clear privacy policy link

❌ **Don't**:

- Make unsubscribe difficult
- Continue emailing after unsubscribe
- Store unnecessary personal data
- Share customer emails with third parties

### 8. Exit-Intent Modal

✅ **Do**:

- Only show for guest users
- Trigger once per session
- Make email optional (skip button)
- Show clear value proposition
- Use natural exit detection (mouse to top)

❌ **Don't**:

- Show for logged-in users
- Trigger repeatedly
- Force email entry
- Use aggressive popups
- Trigger on every mouse movement

---

## Conclusion

The Abandoned Cart Recovery system provides a comprehensive solution for recovering lost sales through:

1. **Automated Detection** - Hourly cron identifies abandoned carts
2. **Smart Email Strategy** - 3-series campaign with increasing urgency
3. **Proactive Capture** - Exit-intent modal catches abandonment early
4. **Seamless Recovery** - One-click token-based restoration
5. **Admin Management** - Full dashboard for monitoring and actions
6. **Analytics Integration** - Track performance and optimize

### Key Metrics to Monitor

- **Recovery Rate**: Target > 30%
- **Conversion Rate**: Target > 50%
- **Revenue Recovered**: Total order value from recovered carts
- **Email Open Rate**: Track via SES (if configured)
- **Reminder Effectiveness**: Which reminder number converts best?

### Next Steps

1. ✅ Deploy to production
2. ✅ Verify AWS SES sender identity
3. ✅ Configure CRON_SECRET
4. ✅ Test email delivery
5. ✅ Monitor initial recovery rates
6. ✅ Optimize settings based on data
7. ✅ Add A/B testing for email content

### Related Documentation

- [ABANDONED_CART_CRON.md](./ABANDONED_CART_CRON.md) - Cron setup and operations
- [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) - Project roadmap and priorities
- [TAX_SYSTEM.md](./TAX_SYSTEM.md) - Tax calculation integration
- [GUEST_CHECKOUT.md](./GUEST_CHECKOUT.md) - Guest user workflow

---

**Feature Status**: ✅ **COMPLETE** (Feature 7 of 8)  
**Last Updated**: October 5, 2025  
**Maintainer**: Development Team
