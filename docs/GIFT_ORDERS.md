# Gift Orders Feature - Implementation Guide

**Created**: October 5, 2025  
**Status**: Partially Complete ✅  
**Feature Type**: Customer Experience Enhancement

---

## Overview

The Gift Orders feature allows customers to mark orders as gifts and include personalized gift messages. This feature enhances the shopping experience by making it easy for customers to send gifts to their loved ones with thoughtful messages.

### Business Value

- **Increased AOV**: Gift shoppers typically spend more
- **Customer Satisfaction**: Thoughtful feature that differentiates your store
- **Repeat Business**: Positive gift experiences lead to return customers
- **Seasonal Boost**: Essential for holidays, birthdays, and special occasions

---

## Features Implemented

### ✅ Core Components

1. **Gift Message Validation** (`src/schemas/gift-order.schema.ts`)
   - Zod schemas for type-safe validation
   - 500-character limit enforcement
   - Optional extended schema for future recipient notifications
2. **Gift Message Utilities** (`src/lib/gift-message-utils.ts`)
   - Content moderation (inappropriate content filtering)
   - Security features (blocks URLs, emails, phone numbers)
   - Character counting and validation
   - HTML sanitization for safe display
   - Formatting utilities for display
3. **Gift Options Component** (`src/components/gift-order-options.tsx`)
   - Interactive checkbox to mark order as gift
   - Textarea for gift message with real-time validation
   - Character counter with visual progress bar
   - Live preview of gift message card
   - Error handling and user feedback
4. **Gift Message Display** (`src/components/gift-message-card.tsx`)
   - Three display variants:
     - **Default**: Full card with gradient background (order details)
     - **Compact**: Minimal design (email, small spaces)
     - **Elegant**: Printable design with serif fonts (packing slips)
   - Supports sender name display
   - Responsive and accessible

5. **Order UI Enhancements**
   - Gift badge (🎁) in order lists
   - Gift indicator in order details header
   - Gift message card in order details
   - Visual indicators throughout admin and customer interfaces

### 🚧 Pending Implementation

The following features require a checkout flow to be implemented:

- **Step 2**: Checkout action integration
- **Step 5**: Checkout UI integration
- **Step 8**: Email templates with gift messages
- **Step 9**: Gift-specific invoice generation (no prices shown)

---

## Database Schema

The Order model already includes gift support:

```prisma
model Order {
  // ... other fields

  // Gift order support
  isGift      Boolean @default(false)
  giftMessage String? @db.Text

  // ... other fields
}
```

No database migrations needed - schema is already in place!

---

## Implementation Guide

### For Developers: Integrating Gift Orders

#### 1. Add Gift Options to Checkout Page

```tsx
import GiftOrderOptions from "@/components/gift-order-options";
import { useState } from "react";
import type { GiftOrderOptions as GiftOptions } from "@/schemas/gift-order.schema";

function CheckoutPage() {
  const [giftOptions, setGiftOptions] = useState<GiftOptions>({
    isGift: false,
    giftMessage: null,
  });

  return (
    <div>
      {/* ... shipping address form ... */}

      {/* Gift Options Section */}
      <GiftOrderOptions value={giftOptions} onChange={setGiftOptions} showPreview={true} />

      {/* ... payment section ... */}
    </div>
  );
}
```

#### 2. Include Gift Data When Creating Order

```typescript
import { giftOrderOptionsSchema } from "@/schemas/gift-order.schema";
import { moderateGiftMessage } from "@/lib/gift-message-utils";

// In your order creation action
async function createOrder(orderData: OrderData) {
  // Validate gift options
  const giftResult = giftOrderOptionsSchema.safeParse({
    isGift: orderData.isGift,
    giftMessage: orderData.giftMessage,
  });

  if (!giftResult.success) {
    return { success: false, error: "Invalid gift options" };
  }

  // Moderate gift message if present
  if (giftResult.data.isGift && giftResult.data.giftMessage) {
    const moderationResult = moderateGiftMessage(
      giftResult.data.giftMessage,
      true, // strict mode
    );

    if (!moderationResult.success) {
      return { success: false, error: moderationResult.error };
    }
  }

  // Create order with gift data
  const order = await prisma.order.create({
    data: {
      // ... other order fields
      isGift: giftResult.data.isGift,
      giftMessage: giftResult.data.giftMessage,
    },
  });

  return { success: true, order };
}
```

#### 3. Display Gift Messages in Order Confirmations

```tsx
import GiftMessageCard from "@/components/gift-message-card";

function OrderConfirmationPage({ order }) {
  return (
    <div>
      <h1>Order Confirmed!</h1>

      {/* Order details */}

      {/* Gift Message */}
      {order.isGift && order.giftMessage && (
        <GiftMessageCard message={order.giftMessage} senderName={order.customerName} variant="default" />
      )}
    </div>
  );
}
```

#### 4. Include in Email Templates

For email templates, use the compact variant:

```tsx
// In your email template
{
  order.isGift && order.giftMessage && (
    <GiftMessageCard message={order.giftMessage} senderName={order.customerName} variant="compact" />
  );
}
```

#### 5. Create Printable Packing Slip

For packing slips, use the elegant variant:

```tsx
// Packing slip component
function PackingSlip({ order }) {
  return (
    <div className="print:block">
      <h1>Packing Slip</h1>

      {/* Order items without prices for gift orders */}
      {order.items.map((item) => (
        <div key={item.id}>
          {item.productName} × {item.quantity}
          {!order.isGift && <span>${item.totalPrice}</span>}
        </div>
      ))}

      {/* Hide pricing for gift orders */}
      {!order.isGift && (
        <div>
          <strong>Total:</strong> ${order.total}
        </div>
      )}

      {/* Gift Message */}
      {order.isGift && order.giftMessage && (
        <GiftMessageCard message={order.giftMessage} senderName={order.customerName} variant="elegant" />
      )}
    </div>
  );
}
```

---

## API Reference

### Schemas

#### `giftOrderOptionsSchema`

```typescript
{
  isGift: boolean (default: false)
  giftMessage: string | null (max 500 chars, trimmed)
}
```

#### `giftMessageSchema`

```typescript
string (min 1, max 500 chars, trimmed)
```

#### `extendedGiftOrderSchema`

```typescript
{
  isGift: boolean
  giftMessage: string | null
  recipientName: string | null (max 100 chars)
  recipientEmail: string | null (valid email)
  sendGiftNotification: boolean (default: false)
}
```

### Utility Functions

#### Content Moderation

```typescript
moderateGiftMessage(
  message: string,
  strictMode: boolean = false
): { success: boolean; message?: string; error?: string }
```

Validates and moderates gift messages:

- Checks for inappropriate content
- Blocks URLs, emails, phone numbers
- Enforces character limits
- Checks for excessive caps (strict mode)
- Checks for repetitive characters

#### Sanitization

```typescript
sanitizeGiftMessage(message: string): string
```

Escapes HTML entities to prevent XSS attacks.

#### Formatting

```typescript
formatGiftMessageForDisplay(message: string): string
```

Converts line breaks to `<br>` tags for HTML display.

#### Character Info

```typescript
getGiftMessageCharacterInfo(message: string): {
  count: number
  remaining: number
  percentage: number
  isValid: boolean
}
```

Returns character count information for UI feedback.

#### Truncation

```typescript
truncateGiftMessage(
  message: string,
  maxLength: number = 100
): string
```

Truncates message for previews (adds "...").

---

## Component Props

### GiftOrderOptions

```typescript
interface GiftOrderOptionsProps {
  value?: GiftOrderOptions; // Current gift options
  onChange?: (value: GiftOrderOptions) => void; // Change handler
  className?: string; // Additional CSS classes
  showPreview?: boolean; // Show message preview (default: true)
}
```

### GiftMessageCard

```typescript
interface GiftMessageCardProps {
  message: string; // Gift message to display
  senderName?: string | null; // Optional sender name
  className?: string; // Additional CSS classes
  variant?: "default" | "compact" | "elegant"; // Display style
}
```

**Variant Guide:**

- **default**: Order details, confirmations (gradient background, full card)
- **compact**: Emails, small spaces (minimal design, blue theme)
- **elegant**: Packing slips, printable (serif fonts, formal design)

---

## Best Practices

### Security

1. **Always moderate messages** before saving:

   ```typescript
   const result = moderateGiftMessage(message, true);
   if (!result.success) {
     // Handle error
   }
   ```

2. **Sanitize before display**:

   ```typescript
   const safe = sanitizeGiftMessage(message);
   ```

3. **Validate on both client and server**:
   - Client: Real-time feedback
   - Server: Security enforcement

### User Experience

1. **Make it optional**: Don't force customers to write messages
2. **Show character count**: Help users stay within limits
3. **Provide preview**: Let customers see how it will look
4. **Clear errors**: Explain what's wrong and how to fix it

### Privacy

1. **No prices on gift packing slips**: Use conditional rendering
2. **No contact info in messages**: Block emails/phones for privacy
3. **Secure storage**: Gift messages are stored as `@db.Text` (encrypted at rest)

### Content Policy

The moderation system blocks:

- Inappropriate words (customizable list)
- URLs and links (spam protection)
- Email addresses (privacy)
- Phone numbers (privacy)
- Excessive repetition (spam)
- Excessive special characters (abuse)

---

## Testing Checklist

### Component Testing

- [ ] GiftOrderOptions checkbox toggles correctly
- [ ] Character counter updates in real-time
- [ ] Preview shows/hides based on message content
- [ ] Error messages display for invalid content
- [ ] Progress bar colors change appropriately
- [ ] Clear button works

### Integration Testing

- [ ] Gift options save with order
- [ ] Gift message displays in order details
- [ ] Gift badge shows in orders list
- [ ] Gift message appears in confirmation emails
- [ ] Packing slip hides prices for gift orders

### Security Testing

- [ ] XSS attempts are sanitized
- [ ] URLs are blocked
- [ ] Emails are blocked
- [ ] Phone numbers are blocked
- [ ] Character limit enforced server-side
- [ ] Inappropriate content filtered

---

## Future Enhancements

### Phase 2 (Optional)

1. **Recipient Notifications**
   - Email to gift recipient
   - SMS notifications
   - Track gift delivery separately

2. **Gift Wrapping**
   - Add gift wrap option (+$5)
   - Select wrapping paper design
   - Include greeting card

3. **Scheduled Delivery**
   - Deliver on specific date
   - Birthday/Anniversary presets
   - Reminder system for recurring gifts

4. **Gift Registry**
   - Create wishlists for events
   - Share gift registry link
   - Track purchased items

5. **Anonymous Gifts**
   - Option to hide sender name
   - "Secret Santa" mode
   - Surprise delivery

---

## Troubleshooting

### Issue: Gift message not saving

**Solution**: Check that your order creation action includes `isGift` and `giftMessage` fields:

```typescript
const order = await prisma.order.create({
  data: {
    // ... other fields
    isGift: orderData.isGift || false,
    giftMessage: orderData.giftMessage || null,
  },
});
```

### Issue: Character count not updating

**Solution**: Ensure `onChange` is properly connected:

```typescript
<GiftOrderOptions
  value={giftOptions}
  onChange={setGiftOptions}  // This is required
/>
```

### Issue: Gift badge not showing

**Solution**: Check that order data includes `isGift` field in your query:

```typescript
const orders = await prisma.order.findMany({
  select: {
    // ... other fields
    isGift: true,
    giftMessage: true,
  },
});
```

### Issue: XSS vulnerability

**Solution**: Always use `sanitizeGiftMessage()` before rendering user content:

```typescript
const safe = sanitizeGiftMessage(order.giftMessage);
```

Or use the `GiftMessageCard` component which handles sanitization automatically.

---

## Migration Guide

If you have existing orders without gift support:

```sql
-- Add default values for existing orders
UPDATE "Order"
SET "isGift" = false
WHERE "isGift" IS NULL;

UPDATE "Order"
SET "giftMessage" = NULL
WHERE "giftMessage" IS NULL;
```

No schema migration needed - fields already exist in your schema!

---

## Summary

### What's Complete ✅

- Validation schemas
- Content moderation utilities
- Gift options component
- Gift message display component
- Order UI enhancements (badges, indicators)
- Comprehensive documentation

### What's Pending 🚧

- Checkout flow integration (requires checkout page)
- Email template updates (requires email system)
- Gift invoice generation (requires invoice system)
- End-to-end testing

### Quick Start

1. Add `<GiftOrderOptions />` to your checkout page
2. Include `isGift` and `giftMessage` when creating orders
3. Use `<GiftMessageCard />` to display messages
4. Test the full flow with a test order

---

**Questions or Issues?**  
Refer to the code documentation in the respective files or check the troubleshooting section above.

---

**Last Updated**: October 5, 2025  
**Version**: 1.0.0  
**Status**: Core Features Complete, Pending Checkout Integration
