# Wishlist Integration Guide

## Overview

The wishlist feature is fully implemented and ready to integrate into your product pages. This guide shows how to add wishlist functionality anywhere in your application.

## Quick Start

### 1. Add Wishlist Button to Any Component

```tsx
import { WishlistButton } from "@/components/wishlist-button";

// Simple icon-only button (default)
<WishlistButton productId={product.id} />

// Button with text
<WishlistButton
  productId={product.id}
  showText
  variant="outline"
  size="default"
/>

// Custom styled button
<WishlistButton
  productId={product.id}
  variant="ghost"
  size="icon"
  className="absolute top-2 right-2"
/>
```

### 2. Integration Examples

#### Product Card Component

```tsx
// src/components/product-card.tsx
import { WishlistButton } from "@/components/wishlist-button";

export function ProductCard({ product }) {
  return (
    <Card className="relative">
      {/* Wishlist button in corner */}
      <WishlistButton productId={product.id} className="absolute top-2 right-2 z-10" />

      {/* Rest of your product card */}
      <CardContent>{/* ... */}</CardContent>
    </Card>
  );
}
```

#### Product Detail Page

```tsx
// src/app/products/[slug]/page.tsx
import { WishlistButton } from "@/components/wishlist-button";

export default function ProductPage({ product }) {
  return (
    <div>
      <div className="flex gap-4">
        <AddToCartButton productId={product.id} />
        <WishlistButton productId={product.id} showText variant="outline" />
      </div>
    </div>
  );
}
```

#### Product List with Grid

```tsx
// src/components/product-grid.tsx
import { WishlistButton } from "@/components/wishlist-button";

export function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="relative">
          <WishlistButton productId={product.id} className="absolute top-4 right-4" />
          {/* Product content */}
        </div>
      ))}
    </div>
  );
}
```

### 3. Wishlist Count Badge (Optional)

Add a wishlist count to your navigation:

```tsx
// src/components/header.tsx
import { getWishlistCount } from "@/actions/get-wishlist.action";
import { Heart } from "lucide-react";
import Link from "next/link";

export async function Header() {
  const { count } = await getWishlistCount();

  return (
    <nav>
      <Link href="/account/wishlist" className="relative">
        <Heart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {count}
          </span>
        )}
      </Link>
    </nav>
  );
}
```

### 4. Client-Side Wishlist Count

For real-time updates, use a client component:

```tsx
"use client";

import { getWishlistCount } from "@/actions/get-wishlist.action";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function WishlistBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      const result = await getWishlistCount();
      if (result.success) {
        setCount(result.count);
      }
    }
    loadCount();
  }, []);

  return (
    <Link href="/account/wishlist" className="relative">
      <Heart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
```

## Features

### WishlistButton Props

- `productId` (required): The product ID to add/remove
- `variant`: "default" | "outline" | "ghost" (default: "ghost")
- `size`: "default" | "sm" | "lg" | "icon" (default: "icon")
- `showText`: Show "Add to Wishlist" text (default: false)
- `className`: Additional CSS classes

### Button States

- **Not in wishlist**: Empty heart outline
- **In wishlist**: Filled red heart
- **Loading**: Pulsing animation
- **Not authenticated**: Redirects to sign-in page

### User Experience

- ✅ Instant visual feedback with animations
- ✅ Toast notifications for add/remove actions
- ✅ Auto-redirect to sign-in if not authenticated
- ✅ Prevents duplicate additions
- ✅ Real-time wishlist status checking
- ✅ Optimistic UI updates

## Advanced Usage

### Check Multiple Products Status

```tsx
import { checkMultipleWishlistStatus } from "@/actions/check-wishlist.action";

const productIds = products.map((p) => p.id);
const { wishlistStatus } = await checkMultipleWishlistStatus(productIds);

// wishlistStatus = { "product-id-1": true, "product-id-2": false, ... }
```

### Custom Wishlist Logic

```tsx
import { addToWishlist } from "@/actions/add-to-wishlist.action";
import { removeFromWishlist } from "@/actions/remove-from-wishlist.action";

// Add with custom success handler
const result = await addToWishlist({ productId: "..." });
if (result.success) {
  // Custom logic
}

// Remove with custom success handler
const result = await removeFromWishlist({ productId: "..." });
if (result.success) {
  // Custom logic
}
```

## Database Schema

```prisma
model WishlistItem {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
  @@index([createdAt])
}
```

## API Reference

### Server Actions

#### `addToWishlist(data)`

Add a product to the user's wishlist.

- **Params**: `{ productId: string }`
- **Returns**: `{ success: boolean, wishlistItem?, error? }`
- **Auth**: Required

#### `removeFromWishlist(data)`

Remove a product from the user's wishlist.

- **Params**: `{ productId: string }`
- **Returns**: `{ success: boolean, error? }`
- **Auth**: Required

#### `getWishlist()`

Get all items in the user's wishlist with full product details.

- **Returns**: `{ success: boolean, wishlistItems?, error? }`
- **Auth**: Required

#### `getWishlistCount()`

Get the total number of items in the user's wishlist.

- **Returns**: `{ success: boolean, count: number }`
- **Auth**: Optional (returns 0 if not authenticated)

#### `checkWishlistStatus(productId)`

Check if a specific product is in the user's wishlist.

- **Params**: `productId: string`
- **Returns**: `{ success: boolean, isInWishlist: boolean }`
- **Auth**: Optional (returns false if not authenticated)

#### `checkMultipleWishlistStatus(productIds)`

Check multiple products at once.

- **Params**: `productIds: string[]`
- **Returns**: `{ success: boolean, wishlistStatus: Record<string, boolean> }`
- **Auth**: Optional (returns empty object if not authenticated)

## Testing

1. **Test guest user**: Click wishlist button → should redirect to sign-in
2. **Test authenticated user**: Click heart → should add to wishlist
3. **Test removal**: Click filled heart → should remove from wishlist
4. **Test wishlist page**: Navigate to `/account/wishlist` → should show all items
5. **Test filters**: Use "In Stock Only" filter and sort options
6. **Test product card actions**: Click "Add to Cart" from wishlist page

## Troubleshooting

### Prisma Client Errors

If you see "Property 'wishlistItem' does not exist on type 'PrismaClient'":

1. Stop your dev server
2. Run `npx prisma generate`
3. Restart your dev server

### TypeScript Errors

After adding the WishlistItem model, you may need to:

1. Restart your TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
2. Close and reopen affected files

### Button Not Appearing

Make sure you're importing from the correct path:

```tsx
import { WishlistButton } from "@/components/wishlist-button";
```

## Next Steps

1. Add wishlist buttons to your existing product card components
2. Add wishlist count badge to your navigation/header
3. Test the full wishlist flow with different user states
4. Customize button styles to match your design system
5. Consider adding wishlist email reminders (future feature)

## Future Enhancements

Potential features to add later:

- Share wishlist with friends
- Wishlist price drop notifications
- Public/private wishlist toggle
- Add notes to wishlist items
- Move items from wishlist to cart in bulk
- Wishlist analytics for admins

---

**Need Help?** Check the implementation in:

- `src/components/wishlist-button.tsx` - Button component
- `src/app/account/wishlist/page.tsx` - Wishlist page
- `src/actions/*-wishlist.action.ts` - Server actions
