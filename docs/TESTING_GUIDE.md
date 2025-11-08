# Testing Guide - E-commerce Store

This guide provides step-by-step testing flows to verify all features of the ecommerce store.

## Prerequisites

1. **Start Local Environment:**

   ```bash
   # Terminal 1: Start MongoDB
   docker-compose up

   # Terminal 2: Start Stripe CLI for webhooks
   .\start-local-sso.sh

   # Terminal 3: Start Next.js development server
   npm run dev
   ```

2. **Seed Database (Optional):**

   ```bash
   npm run prisma:seed
   ```

   This creates 4 sample products in your database.

3. **Access the Application:**
   - Open browser: `http://localhost:3000`

---

## Test Flow 1: Guest Shopping Experience

### Objective: Test complete guest checkout flow

1. **Browse Products**
   - Navigate to: `http://localhost:3000/products`
   - ✅ Verify: Products grid displays with images, names, descriptions, prices
   - ✅ Verify: Hover effects work on product cards

2. **View Product Details**
   - Click on any product card
   - ✅ Verify: Redirected to `/products/[id]`
   - ✅ Verify: Product image, name, description, price displayed
   - ✅ Verify: "Back to Products" link with arrow icon works

3. **Add to Cart (Guest)**
   - On product detail page:
     - If multiple prices exist, select one from dropdown
     - Enter quantity (try 2)
     - Click "Add to Cart" button with shopping cart icon
   - ✅ Verify: Success toast appears "Added to cart!"
   - ✅ Verify: Page refreshes

4. **View Cart**
   - Navigate to: `http://localhost:3000/cart`
   - ✅ Verify: "Your Cart" heading displays
   - ✅ Verify: Cart shows product with image, name, price
   - ✅ Verify: Quantity can be changed (try changing it)
   - ✅ Verify: "Remove" button with trash icon works
   - ✅ Verify: "Clear Cart" button with trash icon works
   - ✅ Verify: Subtotal calculates correctly
   - ✅ Verify: Empty cart shows shopping bag icon and "Your cart is empty"

5. **Add Multiple Items**
   - Go back to products
   - Add 2-3 different products to cart
   - Return to cart
   - ✅ Verify: All items show correctly

6. **Checkout (Guest)**
   - In cart, click "Proceed to Checkout" button with credit card icon
   - ✅ Verify: Redirected to Stripe Checkout page
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - Fill in email and other details
   - Click "Pay"
   - ✅ Verify: Redirected to `/success` with green checkmark icon
   - ✅ Verify: "Payment Successful!" message
   - ✅ Verify: "View Orders" and "Continue Shopping" buttons

7. **View Orders (Guest)**
   - Click "View Orders"
   - Navigate to: `http://localhost:3000/orders`
   - ✅ Verify: Order appears with package icon if no orders, or order details
   - ✅ Verify: Order shows date, total, status with colored icons
   - ✅ Verify: Order items displayed with images

8. **Test Cancel Flow**
   - Add item to cart
   - Proceed to checkout
   - On Stripe page, click browser back button or close
   - Navigate to: `http://localhost:3000/cancel`
   - ✅ Verify: Red X icon with "Payment Cancelled" message
   - ✅ Verify: "Return to Cart" button works

---

## Test Flow 2: Authenticated User Experience

### Objective: Test user authentication and cart merging

1. **Sign In**
   - Navigate to: `http://localhost:3000`
   - Click "Sign in with Google" button with Chrome icon
   - ✅ Verify: Redirected to Google OAuth
   - Sign in with your Google account
   - ✅ Verify: Redirected back to home page
   - ✅ Verify: "Sign out" button with logout icon appears

2. **Add to Cart (Authenticated)**
   - Navigate to `/products`
   - Add items to cart
   - ✅ Verify: Cart persists across sessions (userId-based)

3. **Test Cart Merging**
   - **Setup:**
     - Sign out (click "Sign out" with logout icon)
     - Add 2 items to cart as guest
     - Sign in with Google
   - Navigate to `/cart`
   - ✅ Verify: Guest cart items merged into user cart
   - ✅ Verify: If items were duplicates, quantities combined

4. **Checkout (Authenticated)**
   - Complete checkout as authenticated user
   - ✅ Verify: Order linked to user account
   - Navigate to `/orders`
   - ✅ Verify: Only your orders show (filtered by userId)

5. **Sign Out and Check Orders**
   - Sign out
   - Navigate to `/orders`
   - ✅ Verify: Can still see orders (not filtered when not authenticated)

---

## Test Flow 3: Admin Product Management

### Objective: Test admin product CRUD operations

1. **Access Admin Area**
   - **Note:** You need ADMIN or SUPER_ADMIN role in database
   - Navigate to: `http://localhost:3000/admin/products`
   - ✅ Verify: If not admin, redirected to home
   - ✅ Verify: If admin, products list shows with "Create Product" button

2. **Create Product**
   - Click "Create Product" button with plus icon
   - ✅ Verify: Dialog opens with form
   - Fill in:
     - Name: "Test Product"
     - Description: "This is a test product"
     - Images: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500`
     - Unit Amount: 2999 (in cents = $29.99)
     - Currency: usd
   - Click "Create" button
   - ✅ Verify: Success (dialog closes)
   - ✅ Verify: New product appears in list
   - ✅ Verify: Product synced to Stripe (check Stripe dashboard)

3. **Edit Product**
   - Click "Edit" button with pencil icon on a product
   - ✅ Verify: Dialog opens pre-filled with product data
   - Change name to "Updated Product Name"
   - Click "Update" button
   - ✅ Verify: Product updated in list
   - ✅ Verify: Changes synced to Stripe

4. **Delete Product (Soft Delete)**
   - Click "Delete" button with trash icon on a product
   - ✅ Verify: Confirmation dialog appears
   - Confirm deletion
   - ✅ Verify: Product removed from active list
   - ✅ Verify: Product shows as "Inactive" in admin view
   - ✅ Verify: Product archived in Stripe (active=false)
   - ✅ Verify: Product no longer appears in public `/products` page

5. **View All Products (Including Inactive)**
   - On `/admin/products`
   - ✅ Verify: Both active and inactive products show
   - ✅ Verify: Status indicator shows "Active" or "Inactive"

---

## Test Flow 4: Admin Order Management

### Objective: Test admin order status updates

1. **Access Admin Orders**
   - Navigate to: `http://localhost:3000/admin/orders`
   - ✅ Verify: All orders from all users displayed
   - ✅ Verify: Orders show customer email, date, total

2. **View Order Details**
   - ✅ Verify: Each order shows:
     - Order date
     - Customer email
     - Total amount
     - Current status with colored badge and icon
     - Order items with images and quantities

3. **Update Order Status**
   - Find an order with status "PENDING" (clock icon)
   - Click status dropdown
   - Select "PROCESSING" (package icon)
   - ✅ Verify: Status updates immediately
   - ✅ Verify: Badge color changes
   - ✅ Verify: Icon changes to package icon

4. **Test All Status Changes**
   - Test changing order through all statuses:
     - **PENDING** → Clock icon, secondary badge
     - **PROCESSING** → Package icon, secondary badge
     - **COMPLETED** → Check circle icon, default badge (green)
     - **FAILED** → X circle icon, destructive badge (red)
     - **CANCELLED** → Ban icon, destructive badge (red)
     - **REFUNDED** → Refresh icon, outline badge
   - ✅ Verify: Each status displays correct icon and color

5. **Check Customer View**
   - Sign in as the customer whose order you updated
   - Navigate to `/orders`
   - ✅ Verify: Updated status reflects in customer order history

---

## Test Flow 5: Edge Cases & Error Handling

### Objective: Test error scenarios and edge cases

1. **Empty States**
   - Clear cart completely
   - Navigate to `/cart`
   - ✅ Verify: Shopping bag icon with "Your cart is empty" message
   - ✅ Verify: "Continue Shopping" button works
   - Sign in and check orders
   - Navigate to `/orders` (with no orders)
   - ✅ Verify: Package icon with "No orders found" message

2. **Admin Access Control**
   - Sign out
   - Try to access: `http://localhost:3000/admin/products`
   - ✅ Verify: Redirected to home page
   - Sign in as regular user (USER role)
   - Try to access admin pages
   - ✅ Verify: Redirected to home page

3. **Product Not Found**
   - Navigate to: `http://localhost:3000/products/invalid-id`
   - ✅ Verify: 404 page or error message

4. **Cart Quantity Updates**
   - Add item to cart
   - Change quantity to 0 or negative
   - ✅ Verify: Quantity validation prevents invalid values
   - Change quantity to 99
   - ✅ Verify: Large quantities work

5. **Multiple Price Options**
   - If you created products with multiple prices:
     - Navigate to product detail
     - ✅ Verify: Price selector dropdown appears
     - Select different price options
     - ✅ Verify: Correct price used in cart

6. **Stripe Webhook Testing**
   - Make a purchase
   - Check terminal running Stripe CLI
   - ✅ Verify: Webhook events logged
   - ✅ Verify: Order created in database
   - ✅ Verify: WebhookEvent record created

---

## Test Flow 6: UI/UX Validation

### Objective: Verify all icons, styling, and interactions

1. **Icon Verification** (All should be Lucide icons, no SVGs)
   - Google Sign In: Chrome icon ✅
   - Sign Out: Logout icon ✅
   - Product Form: Plus icon (create), Pencil icon (edit), Loader icon (saving) ✅
   - Cart: Shopping cart icon, Trash icon, Credit card icon, Arrow left icon ✅
   - Orders: Package icon, Check circle icon, X circle icon, Clock icon ✅
   - Admin Orders: All status icons (Package, Clock, Check, X, Ban, Refresh) ✅
   - Success page: Check circle icon ✅
   - Cancel page: X circle icon ✅

2. **Loading States**
   - Navigate to `/products`
   - ✅ Verify: Skeleton loading state shows before products load
   - Click "Add to Cart" button
   - ✅ Verify: Button shows spinning loader icon during submission

3. **Responsive Design**
   - Resize browser window
   - ✅ Verify: Products grid adjusts (1, 2, 3, or 4 columns)
   - ✅ Verify: Mobile navigation works
   - ✅ Verify: Cart layout adapts to mobile

4. **Toast Notifications**
   - Add to cart: "Added to cart!" ✅
   - Update quantity: "Quantity updated" ✅
   - Remove item: "Item removed" ✅
   - Clear cart: "Cart cleared" ✅

---

## Test Flow 7: Component Pattern Verification

### Objective: Verify all components follow React.FC pattern

1. **Check Component Structure**
   - All components should follow this pattern:

   ```tsx
   import React from "react";

   interface Props {
     // props definition
   }

   const ComponentName: React.FC<Props> = ({ props }) => {
     return <>...</>;
   };

   export default ComponentName;
   ```

2. **Verify No Embedded SVGs**
   - Search codebase for `<svg`
   - ✅ Verify: No embedded SVGs (all use Lucide icons)

---

## Checklist Summary

### Core Features

- [ ] Browse products
- [ ] View product details
- [ ] Add to cart (guest)
- [ ] Add to cart (authenticated)
- [ ] Update cart quantities
- [ ] Remove cart items
- [ ] Clear cart
- [ ] Guest checkout
- [ ] Authenticated checkout
- [ ] View orders
- [ ] Cart merging on login

### Admin Features

- [ ] Admin access control
- [ ] Create product
- [ ] Edit product
- [ ] Delete product (soft delete)
- [ ] View all orders
- [ ] Update order status

### Authentication

- [ ] Google sign in
- [ ] Sign out
- [ ] Role-based access (USER/ADMIN/SUPER_ADMIN)

### Stripe Integration

- [ ] Checkout session creation
- [ ] Payment processing
- [ ] Webhook handling
- [ ] Order creation via webhook

### UI/UX

- [ ] All Lucide icons (no embedded SVGs)
- [ ] All components use React.FC pattern
- [ ] Loading states
- [ ] Empty states
- [ ] Toast notifications
- [ ] Responsive design

---

## Troubleshooting

### Issue: Can't access admin pages

**Solution:** Update user role in database to ADMIN or SUPER_ADMIN:

```bash
npm run prisma:studio
# Open User table, edit your user, change roles from [USER] to [ADMIN]
```

### Issue: Stripe webhooks not working

**Solution:**

1. Make sure Stripe CLI is running: `.\start-local-sso.sh`
2. Check webhook secret in `.env.local` matches CLI output
3. Verify webhook events in terminal logs

### Issue: Products not showing

**Solution:**

1. Run seed script: `npm run prisma:seed`
2. Or create products via admin panel
3. Check MongoDB is running: `docker-compose up`

### Issue: Cart not persisting

**Solution:**

1. Check cookies are enabled in browser
2. For guests: `cart_session_id` cookie should be set
3. For users: Check user is properly authenticated

---

## Expected Outcomes

After completing all test flows, you should have:

✅ **Working E-commerce Store** with:

- Product catalog browsing
- Shopping cart (guest & authenticated)
- Stripe checkout integration
- Order tracking
- Admin product management
- Admin order management
- User authentication with Google
- Role-based access control
- Cart merging on login
- All UI using Lucide icons
- All components following React.FC pattern

🎉 **Congratulations!** Your ecommerce store is fully functional!
