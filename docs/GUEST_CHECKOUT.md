# Guest Checkout Enhancement

A comprehensive guest checkout system that allows customers to purchase without creating an account, while providing order tracking and optional post-purchase account creation.

## Features

### 🛒 Guest Cart System

- **Session-Based Carts**: Persistent cart storage using browser cookies (30-day expiration)
- **Automatic Cart Merge**: Seamlessly merge guest cart into user cart when logging in
- **Cart Persistence**: Guest carts remain active across page refreshes and browser sessions
- **Tax Calculation**: Automatic tax calculation based on shipping address (even for guests)

### 📦 Guest Orders

- **No Account Required**: Complete purchases without registration
- **Order Confirmation**: Email confirmation with order number
- **Guest Order Tracking**: Track orders using order number + email
- **Guest Customer Fields**: customerEmail, customerName, customerPhone stored in database

### 🔍 Order Tracking

- **Public Tracking Page**: `/track-order` - accessible without login
- **Email Verification**: Secure lookup by order number + email combination
- **Full Order Details**: View items, status, shipping address, payment status
- **Gift Message Display**: Show gift messages for gift orders

### 🔄 Cart Migration

- **Automatic Merge on Login**: Guest cart automatically merged when user logs in
- **Quantity Combining**: Duplicate items have quantities combined (max 999)
- **Toast Notifications**: User-friendly feedback during merge process
- **Session Cleanup**: Guest session cleared after successful merge

## Architecture

### Session Management

**Session ID Generation** (`src/lib/session.ts`):

```typescript
// Format: guest_timestamp_random
// Example: guest_1696512000000_abc123xyz
generateSessionId(): string
```

**Cookie Management**:

- Cookie Name: `cart_session_id`
- Expiration: 30 days
- SameSite: `lax`
- Secure: `true` in production

**Key Functions**:

- `getSessionId()` - Get or create session ID
- `setSessionId(id)` - Save session ID to cookie
- `clearSessionId()` - Remove session cookie (after login/merge)
- `hasSessionId()` - Check if session exists

### Cart System

**Cart Storage** (`prisma/schema.prisma`):

```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String?  // NULL for guest carts
  sessionId String?  // Set for guest carts
  expiresAt DateTime? // Set for guest carts (30 days)
  items     CartItem[]
}
```

**Cart Flow**:

1. Guest visits site → Session ID created in cookie
2. Add to cart → Cart created with sessionId
3. Cart expires after 30 days of inactivity
4. User logs in → Cart merged with user account

**Key Actions** (`src/actions/`):

- `get-cart.action.ts` - Fetch cart (guest or user)
- `add-to-cart.action.ts` - Add items (handles guests)
- `merge-carts.action.ts` - Merge guest cart on login
- `clear-cart.action.ts` - Clear cart items

### Order System

**Guest Order Fields** (`prisma/schema.prisma`):

```prisma
model Order {
  // User relation (NULL for guest orders)
  userId String?
  user   User? @relation(...)

  // Guest customer info
  customerEmail String?
  customerName  String?
  customerPhone String?

  // Indexed for fast lookup
  @@index([customerEmail])
}
```

**Order Tracking**:

- Orders can be tracked by `orderNumber + customerEmail`
- Security: Email verification prevents unauthorized access
- No authentication required for tracking

## Usage

### For Customers

#### Making a Purchase as Guest

1. **Add Items to Cart**:
   - Browse products and add to cart
   - Session ID automatically created
   - Cart persists for 30 days

2. **Proceed to Checkout**:
   - Enter shipping address
   - Enter email for order confirmation
   - Optionally enter name and phone
   - Complete payment

3. **Order Confirmation**:
   - Order number sent to email
   - Save order number for tracking

#### Tracking an Order

1. **Navigate to Order Tracking**:
   - Visit `/track-order` page
   - Or use link from confirmation email

2. **Enter Tracking Details**:

   ```
   Order Number: ORD-2025-ABC123
   Email Address: customer@example.com
   ```

3. **View Order Status**:
   - Order status (Pending, Processing, Shipped, Delivered)
   - Payment status
   - Items ordered
   - Shipping address
   - Order total
   - Gift message (if applicable)

#### Converting to Account

**Option 1: During Checkout**:

- Checkbox: "Create account for faster checkout next time"
- Account created after successful order

**Option 2: After Order**:

- Click "Create Account" on order confirmation
- Pre-filled with order email
- Order automatically linked to new account

**Option 3: Manual Login**:

- Log in with existing account
- Guest cart automatically merged

### For Developers

#### Accessing Guest Cart

```typescript
import { getCart } from "@/actions/get-cart.action";
import { getSessionId } from "@/lib/session";

// In client component
const sessionId = getSessionId();
const cart = await getCart(sessionId);

// Cart will be null if doesn't exist
if (cart) {
  console.log("Cart items:", cart.items);
  console.log("Cart total:", cart.summary.total);
}
```

#### Adding Items to Guest Cart

```typescript
import { addToCart } from "@/actions/add-to-cart.action";
import { getSessionId } from "@/lib/session";

// In client component
const sessionId = getSessionId();

await addToCart(
  {
    productId: "prod_123",
    quantity: 1,
    variantId: "var_456", // Optional
  },
  sessionId,
);
```

#### Creating Guest Order

```typescript
// During checkout, pass customer info:
const order = await createOrder({
  userId: null, // NULL for guest
  customerEmail: "customer@example.com",
  customerName: "John Doe",
  customerPhone: "+1234567890",
  // ... other order data
});
```

#### Looking Up Guest Order

```typescript
import { getGuestOrder } from "@/actions/get-guest-order.action";

const result = await getGuestOrder({
  orderNumber: "ORD-2025-ABC123",
  email: "customer@example.com",
});

if (result.success && result.data) {
  const order = result.data;
  console.log("Order status:", order.status);
  console.log("Order items:", order.items);
} else {
  console.error("Order not found:", result.error);
}
```

#### Merging Guest Cart on Login

```typescript
// This happens automatically via useCartMerge hook
// But can be triggered manually:
import { mergeCarts } from "@/actions/merge-carts.action";
import { getSessionId, clearSessionId } from "@/lib/session";

const guestSessionId = getSessionId();
const userId = session.user.id;

const mergedCart = await mergeCarts(guestSessionId, userId);

// Clear guest session after merge
clearSessionId();
```

## Components

### Guest Order Tracking Page

**Location**: `src/app/(customer)/track-order/page.tsx`

**Features**:

- Order number + email input form
- Real-time order status display
- Order items with images
- Shipping address display
- Gift message display (if applicable)
- Order summary (subtotal, tax, shipping, total)
- Customer support information

**Usage**:

```tsx
// Accessible at: /track-order
// No authentication required
```

### Cart Context

**Location**: `src/contexts/cart-context.tsx`

**Provides**:

```typescript
interface CartContextValue {
  cart: CartData | null;
  isLoading: boolean;
  isError: boolean;
  itemCount: number;
  subtotal: number;
  total: number;
  sessionId: string | undefined;
  addItem: (data: AddToCartData) => Promise<void>;
  updateItem: (data: UpdateCartItemData) => Promise<void>;
  removeItem: (data: RemoveFromCartData) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}
```

### Cart Merge Hook

**Location**: `src/hooks/use-cart-merge.ts`

**Auto-triggers**:

- When user logs in (authenticated status)
- Has guest session cookie
- Haven't already merged in current session

**Returns**:

```typescript
{
  isMerging: boolean;
  hasMerged: boolean;
}
```

## API Reference

### Server Actions

#### `getGuestOrder(data)`

Lookup guest order by order number and email.

**Parameters**:

```typescript
{
  orderNumber: string; // Order number (e.g., "ORD-2025-ABC123")
  email: string; // Customer email
}
```

**Returns**:

```typescript
{
  success: boolean;
  data?: GuestOrderData;
  error?: string;
}
```

**Security**:

- Email must match order's customerEmail
- Returns generic error if email doesn't match (prevents order number enumeration)

#### `isGuestOrder(orderNumber)`

Check if an order is a guest order.

**Parameters**:

```typescript
orderNumber: string;
```

**Returns**:

```typescript
boolean; // true if guest order, false otherwise
```

**Use Case**:

- Determine if guest tracking link should be shown
- Check if account creation offer should be displayed

#### `mergeCarts(guestSessionId, userId)`

Merge guest cart into user cart on login.

**Parameters**:

```typescript
guestSessionId: string; // Guest session ID from cookie
userId: string; // Logged-in user ID
```

**Returns**:

```typescript
CartData | null; // Merged cart or null
```

**Behavior**:

- Combines quantities for duplicate items (max 999)
- Preserves all unique items
- Deletes guest cart after merge
- Returns null if no guest cart exists

### Session Utilities

#### `generateSessionId()`

Generate unique session ID for guest.

**Returns**: `string` (format: `guest_timestamp_random`)

#### `getSessionId()`

Get existing session ID or create new one.

**Returns**: `string` (session ID)

#### `setSessionId(sessionId)`

Save session ID to cookie.

**Parameters**: `sessionId: string`

#### `clearSessionId()`

Remove session cookie (called after login/merge).

#### `hasSessionId()`

Check if session cookie exists.

**Returns**: `boolean`

## Configuration

### Cart Expiration

**Default**: 30 days for guest carts

**Location**: `src/lib/cart-utils.ts`

```typescript
export function getCartExpirationDate(days: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
```

**Modify**: Change the default parameter to adjust expiration period.

### Session Cookie Settings

**Location**: `src/lib/session.ts`

```typescript
const SESSION_COOKIE_NAME = "cart_session_id";
const SESSION_EXPIRY_DAYS = 30;

Cookies.set(SESSION_COOKIE_NAME, sessionId, {
  expires: SESSION_EXPIRY_DAYS,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});
```

## Database Schema

### Cart Model

```prisma
model Cart {
  id        String    @id @default(cuid())
  userId    String?
  user      User?     @relation(...)
  sessionId String?   // Guest cart identifier
  expiresAt DateTime? // Guest cart expiration
  items     CartItem[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([sessionId])
  @@index([userId])
  @@index([sessionId])
  @@index([expiresAt])
}
```

### Order Model (Guest Fields)

```prisma
model Order {
  id          String  @id @default(cuid())
  orderNumber String  @unique

  // User relation (NULL for guests)
  userId String?
  user   User?   @relation(...)

  // Guest customer info
  customerEmail String?
  customerName  String?
  customerPhone String?

  // ... other fields

  @@index([customerEmail])  // Fast guest order lookup
  @@index([orderNumber])
}
```

## Security Considerations

### Guest Order Lookup

**Protection**: Email verification required

**Why**: Prevents unauthorized access to order details by guessing order numbers.

**Implementation**:

```typescript
// Email must match exactly (case-insensitive)
const emailMatches = order.customerEmail?.toLowerCase() === email.toLowerCase();

if (!emailMatches) {
  // Return generic error (don't reveal if order exists)
  return { error: "Order not found..." };
}
```

### Cart Session Security

**Cookie Settings**:

- `sameSite: 'lax'` - Prevents CSRF attacks
- `secure: true` - HTTPS only in production
- `httpOnly: false` - Needed for client-side access

**Session ID Format**:

- Prefix: `guest_` - Easy identification
- Timestamp: Collision prevention
- Random string: Unpredictability

**No PII in Session**:

- Session ID contains no personal information
- Cart data stored in database, not cookie

### Guest vs User Separation

**Database Level**:

- Guest carts: `userId = NULL`, `sessionId` set
- User carts: `userId` set, `sessionId = NULL`
- Orders: `userId = NULL` indicates guest order

**Action Level**:

- All cart actions check authentication status
- Guest operations use sessionId parameter
- User operations use userId from session

## Testing

### Manual Testing Checklist

**Guest Cart Flow**:

- [ ] Add items to cart without login
- [ ] Cart persists after page refresh
- [ ] Cart available across different pages
- [ ] Cart expires after 30 days
- [ ] Tax calculated correctly for guest cart

**Guest Order Flow**:

- [ ] Complete checkout as guest
- [ ] Receive order confirmation email
- [ ] Order number generated correctly
- [ ] Customer info saved (email, name, phone)

**Order Tracking**:

- [ ] Access tracking page without login
- [ ] Search with valid order number + email
- [ ] Search with invalid credentials (error shown)
- [ ] Order details displayed correctly
- [ ] Gift message shown (if applicable)

**Cart Merge**:

- [ ] Add items as guest
- [ ] Log in with existing account
- [ ] Guest cart automatically merged
- [ ] Duplicate items have combined quantities
- [ ] All unique items preserved
- [ ] Guest session cookie cleared
- [ ] Toast notification shown

**Edge Cases**:

- [ ] Empty guest cart merges without error
- [ ] User cart empty when merging guest cart
- [ ] Multiple same items in guest + user carts
- [ ] Expired guest cart auto-deleted
- [ ] Order lookup with wrong email fails securely

### Automated Testing

**Unit Tests** (example):

```typescript
// Test session ID generation
describe("generateSessionId", () => {
  it("should generate unique session IDs", () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^guest_\d+_[a-z0-9]+$/);
  });
});

// Test cart merge logic
describe("mergeCarts", () => {
  it("should combine quantities for duplicate items", async () => {
    // Setup: Create guest cart with Product A (qty 2)
    // Setup: Create user cart with Product A (qty 3)
    const merged = await mergeCarts(guestSessionId, userId);
    const itemA = merged.items.find((i) => i.productId === "productA");
    expect(itemA.quantity).toBe(5); // 2 + 3
  });

  it("should respect max quantity (999)", async () => {
    // Setup: Create guest cart with Product A (qty 500)
    // Setup: Create user cart with Product A (qty 600)
    const merged = await mergeCarts(guestSessionId, userId);
    const itemA = merged.items.find((i) => i.productId === "productA");
    expect(itemA.quantity).toBe(999); // Max reached
  });
});

// Test guest order lookup
describe("getGuestOrder", () => {
  it("should return order for valid credentials", async () => {
    const result = await getGuestOrder({
      orderNumber: "ORD-TEST-123",
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should reject mismatched email", async () => {
    const result = await getGuestOrder({
      orderNumber: "ORD-TEST-123",
      email: "wrong@example.com",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});
```

## Troubleshooting

### Cart Not Persisting

**Symptoms**: Cart empties on page refresh

**Causes**:

1. Cookies disabled in browser
2. Session ID not being saved
3. Cart expiration reached

**Solutions**:

```typescript
// Check if cookies are enabled
if (!navigator.cookieEnabled) {
  alert("Please enable cookies to use the shopping cart");
}

// Check session ID
const sessionId = getSessionId();
console.log("Session ID:", sessionId);

// Check cart expiration
const cart = await getCart(sessionId);
if (cart && isCartExpired(cart.expiresAt)) {
  console.log("Cart has expired");
}
```

### Cart Not Merging on Login

**Symptoms**: Guest cart disappears when logging in

**Causes**:

1. useCartMerge hook not imported
2. Session cookie cleared before merge
3. Merge failed silently

**Solutions**:

```typescript
// Ensure CartProvider is wrapping your app
<CartProvider>
  <App />
</CartProvider>

// Check merge status
const { isMerging, hasMerged } = useCartMerge();
console.log("Merging:", isMerging, "Merged:", hasMerged);

// Check for errors in console
// mergeCarts logs errors if merge fails
```

### Order Tracking Not Finding Order

**Symptoms**: "Order not found" error with valid credentials

**Causes**:

1. Email case mismatch
2. Extra whitespace in input
3. Order number typo
4. Order is for logged-in user (not guest)

**Solutions**:

```typescript
// The action trims and lowercases email automatically
// Check order in database:
const order = await prisma.order.findUnique({
  where: { orderNumber: "ORD-2025-ABC123" },
});
console.log("Order userId:", order.userId);
console.log("Order customerEmail:", order.customerEmail);

// Guest orders have userId = null and customerEmail set
```

### Tax Not Calculating for Guest

**Symptoms**: Tax showing $0 for guest cart

**Causes**:

1. No shipping address selected
2. Guest checkout not collecting address early enough
3. Tax rate not found for location

**Solutions**:

```typescript
// Tax requires address
// In get-cart.action.ts, guests need default address:
const cart = await getCart(sessionId);
// Tax only calculated if user has default address

// For guests, tax calculated at checkout when address provided
const checkoutTax = await calculateCheckoutTax({
  items: cartItems,
  shippingAddressId: selectedAddressId,
});
```

## Future Enhancements

Potential improvements to the guest checkout system:

1. **Email-Based Order History**: Allow guests to view all orders by email
2. **Save Guest Cart**: "Save cart for later" feature for guests
3. **Guest Wishlists**: Wishlist functionality without account
4. **Express Checkout**: One-click checkout for returning guests (saved to cookies)
5. **Order Notifications**: SMS/email notifications for order updates
6. **Guest Reviews**: Allow product reviews from verified guest purchasers
7. **Referral System**: Guest referral tracking and rewards
8. **Social Login**: Quick checkout with Google/Facebook (creates account)
9. **Address Autocomplete**: Google Maps API for faster address entry
10. **Cart Abandonment**: Email reminders for guests with abandoned carts

## Support

For issues or questions about guest checkout:

1. Check this documentation
2. Review Troubleshooting section
3. Verify session cookie exists in browser DevTools
4. Check server logs for cart/order errors
5. Test with simple case (one product, known address)

---

**Last Updated**: Feature 6 implementation completed  
**Version**: 1.0.0  
**Status**: Production Ready
