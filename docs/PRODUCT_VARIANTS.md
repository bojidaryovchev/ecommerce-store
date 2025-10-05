# Product Variants System - Complete Implementation ✅

## Overview

The Product Variants system allows products to have multiple variations (e.g., sizes, colors, materials) with independent pricing, inventory, and options. This feature is fully integrated into the ecommerce platform with both admin management tools and customer-facing selection interfaces.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Admin Guide](#admin-guide)
- [Technical Reference](#technical-reference)
- [Common Configurations](#common-configurations)
- [API Reference](#api-reference)

---

## Features

### ✅ Admin Features

- **Individual Variant Management**: Create, edit, and delete variants with custom names, SKUs, prices, and stock
- **Bulk Variant Generation**: Automatically generate all combinations from option types (e.g., Size × Color)
- **Quick Edit Modal**: Batch update prices and stock quantities for multiple variants at once
- **Inventory Tracking**: Real-time stock management with low-stock alerts
- **SKU Auto-generation**: Pattern-based SKU generation with customizable templates
- **Variant Preview**: Preview all combinations before creating variants
- **Order Protection**: Prevents deletion of variants that have been ordered

### ✅ Customer Features

- **Variant Selector**: Interactive UI for selecting product options (button or dropdown style)
- **Smart Filtering**: Only shows available option combinations
- **Stock Status Display**: Real-time availability indicators (in stock, low stock, out of stock)
- **Price Updates**: Prices update dynamically based on selected variant
- **Cart Integration**: Variants displayed with formatted options in cart
- **Price Ranges**: Product listings show price ranges for variable products

---

## Architecture

### Database Schema

```prisma
model ProductVariant {
  id            String    @id @default(cuid())
  productId     String
  name          String
  sku           String?   @unique
  barcode       String?
  price         Decimal?  @db.Decimal(10, 2)
  stockQuantity Int       @default(0)
  options       Json?     // { "Size": "Large", "Color": "Red" }
  isActive      Boolean   @default(true)
  product       Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems     CartItem[]
  orderItems    OrderItem[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### File Structure

```
src/
├── actions/
│   ├── create-variant.action.ts
│   ├── update-variant.action.ts
│   ├── delete-variant.action.ts
│   ├── get-variants.action.ts
│   ├── generate-variants.action.ts
│   └── adjust-variant-stock.action.ts
├── components/
│   ├── admin/
│   │   ├── product-variant-list.tsx
│   │   ├── product-variant-form.tsx
│   │   ├── bulk-variant-generator.tsx
│   │   ├── variant-quick-edit-modal.tsx
│   │   └── quick-edit-button.tsx
│   ├── variant-selector.tsx
│   └── cart-item.tsx (updated)
├── lib/
│   └── variant-utils.ts (25+ utility functions)
├── schemas/
│   └── product-variant.schema.ts (11+ Zod schemas)
└── app/
    └── admin/
        └── products/
            └── [id]/
                └── variants/
                    └── page.tsx
```

---

## Admin Guide

### Creating Product Variants

#### Method 1: Individual Variant Creation

1. Navigate to **Admin → Products**
2. Click the **"Variants"** button on any product card
3. Click **"Add Variant"** button
4. Fill in the form:
   - **Name**: Display name (e.g., "Large - Red")
   - **SKU**: Unique identifier (auto-generated or custom)
   - **Price**: Variant-specific price
   - **Stock Quantity**: Inventory count
   - **Options**: Key-value pairs (e.g., Size: Large, Color: Red)
   - **Active**: Toggle visibility to customers
5. Click **"Create Variant"**

**Real-time Validation**:

- SKU uniqueness is checked as you type
- Duplicate option combinations are prevented

#### Method 2: Bulk Variant Generation

Best for creating many variants at once (e.g., all size/color combinations).

1. Go to product variants page
2. Click **"Bulk Generate"** tab
3. Define option types:
   - **Add Option Type**: Click to add (e.g., "Size")
   - **Enter Values**: Comma-separated (e.g., "Small, Medium, Large")
   - Repeat for other options (e.g., "Color: Red, Blue, Green")
4. Configure base settings:
   - **Base Price**: Starting price for all variants
   - **Base Stock**: Initial inventory for each
   - **SKU Pattern**: Template for auto-generation
     - `{BASE}-{0}-{1}` → Uses product SKU + option indexes
     - `{BASE}-{Size}-{Color}` → Uses option names
5. Click **"Preview Combinations"**
   - Review all variants that will be created
   - See which combinations already exist (skipped)
   - Maximum 100 combinations allowed
6. Click **"Generate X Variants"** to create

**Example**:

- Size: [S, M, L] × Color: [Red, Blue] = 6 variants auto-created
- SKU Pattern: `SHIRT-{Size}-{Color}` → SHIRT-S-Red, SHIRT-S-Blue, etc.

### Managing Variants

#### Quick Edit (Batch Updates)

Efficiently update prices or stock for multiple variants:

1. On variants page, click **"Quick Edit"** button
2. Choose tab:
   - **Price Adjustments**: Modify pricing
   - **Stock Adjustments**: Update inventory
3. Select variants using checkboxes
4. Choose operation mode:
   - **Set to**: Replace with specific value
   - **Increase by**: Add amount
   - **Decrease by**: Subtract amount
5. Enter value and click **"Apply to X selected"**
6. Review changes in table (modified rows highlighted)
7. Click **"Save Changes"**

**Use Cases**:

- Seasonal sales: Decrease all variant prices by $10
- Restocking: Set all variants to 50 units
- Price adjustment: Increase all prices by 5%

#### Individual Editing

1. Click **"Edit"** button on any variant in the list
2. Modify fields as needed
3. Save changes

#### Deleting Variants

- Click **"Delete"** button on variant
- Confirm deletion
- **Note**: Variants with orders cannot be deleted (deactivate instead)

### Inventory Management

#### Stock Status Indicators

Variants display automatic status badges:

- 🟢 **In Stock** (> 5 units)
- 🟡 **Low Stock** (1-5 units)
- 🔴 **Out of Stock** (0 units)
- ⚪ **Inactive** (not available to customers)

#### Stock Adjustment Actions

Available via server actions:

```typescript
// Single variant adjustment
adjustVariantStock({ id: "variant_id", adjustment: -5 }); // Decrease by 5

// Bulk absolute quantities
bulkAdjustVariantStock({
  adjustments: [
    { id: "variant1", newQuantity: 50 },
    { id: "variant2", newQuantity: 30 },
  ],
});

// Query low stock
getLowStockVariants({ threshold: 5 });
```

---

## Technical Reference

### Core Utility Functions

Located in `src/lib/variant-utils.ts`:

#### Combination Generation

```typescript
// Generate all combinations from option types
generateVariantCombinations([
  { name: "Size", values: ["S", "M", "L"] },
  { name: "Color", values: ["Red", "Blue"] },
]);
// Returns: [
//   { Size: "S", Color: "Red" },
//   { Size: "S", Color: "Blue" },
//   { Size: "M", Color: "Red" },
//   // ... 6 total combinations
// ]
```

#### SKU Generation

```typescript
// Auto-generate SKU with pattern
generateVariantSku(
  "SHIRT", // Base SKU
  { Size: "L", Color: "Red" }, // Options
  "{BASE}-{Size}-{Color}", // Pattern
);
// Returns: "SHIRT-L-Red"
```

#### Availability Checking

```typescript
// Check if variant is available
isVariantAvailablefunction(variant);
// Returns: boolean (isActive && stockQuantity > 0)

// Get detailed availability
getVariantAvailability(variant);
// Returns: {
//   status: "in-stock" | "low-stock" | "out-of-stock" | "inactive",
//   available: boolean,
//   message: string
// }
```

#### Price Calculations

```typescript
// Get price range for variants
getVariantPriceRange(variants);
// Returns: { min: 19.99, max: 49.99 }
```

#### Display Formatting

```typescript
// Format options for display
formatVariantDisplay({ Size: "Large", Color: "Red" });
// Returns: "Size: Large • Color: Red"

// Generate variant name
generateVariantName({ Size: "L", Color: "Blue" });
// Returns: "L - Blue"
```

#### Smart Filtering

```typescript
// Get available option values based on current selection
getAvailableOptionValues(
  variants,
  "Color", // Option type
  { Size: "Large" }, // Current selections
);
// Returns: ["Red", "Blue"] // Only colors available for Large

// Find variant by exact options
findVariantByOptions(variants, { Size: "L", Color: "Red" });
// Returns: matching ProductVariant or null
```

### Validation Schemas

All operations are type-safe with Zod schemas in `src/schemas/product-variant.schema.ts`:

```typescript
// Create variant
productVariantSchema.parse({
  productId: "prod_123",
  name: "Large - Red",
  sku: "SHIRT-L-RED",
  price: 29.99,
  stockQuantity: 50,
  options: { Size: "Large", Color: "Red" },
  isActive: true,
});

// Bulk generate
bulkGenerateVariantsSchema.parse({
  productId: "prod_123",
  optionTypes: [
    { name: "Size", values: ["S", "M", "L"] },
    { name: "Color", values: ["Red", "Blue"] },
  ],
  basePrice: 29.99,
  baseStockQuantity: 100,
  autoGenerateSku: true,
  skuPattern: "{BASE}-{0}-{1}",
});
```

### Server Actions

All actions require admin authentication and perform validation:

#### CRUD Operations

- `createVariant(data)` - Create single variant
- `updateVariant(data)` - Update variant properties
- `deleteVariant(data)` - Delete variant (if not ordered)
- `getVariants(data)` - Fetch variants for product
- `getVariantById(id)` - Get single variant with details

#### Bulk Operations

- `generateVariants(data)` - Create multiple variants from combinations
- `previewVariantCombinations(data)` - Preview without creating
- `deleteAllVariants(productId)` - Clear all variants (if none ordered)

#### Inventory

- `adjustVariantStock(data)` - Incremental adjustment (+/-)
- `bulkAdjustVariantStock(data)` - Batch absolute quantities
- `setVariantStock(data)` - Set exact quantity
- `getLowStockVariants(threshold)` - Query low stock
- `getOutOfStockVariants()` - Query out of stock

### Cart Integration

Cart actions automatically handle variants:

```typescript
// Add variant to cart
addToCart({
  productId: "prod_123",
  variantId: "var_456", // Optional
  quantity: 2,
});
// Validates variant stock availability

// Update cart item
updateCartItem({
  cartItemId: "item_789",
  quantity: 3,
});
// Checks variant stock before updating
```

---

## Common Configurations

### Example 1: Clothing Store

**T-Shirts with Size and Color**

Option Types:

- Size: XS, S, M, L, XL, XXL
- Color: Black, White, Navy, Gray, Red

Configuration:

- **Variants**: 30 combinations (6 sizes × 5 colors)
- **SKU Pattern**: `TSHIRT-{Size}-{Color}`
- **Base Price**: $19.99
- **Price Variations**: Premium colors +$5
- **Stock Strategy**: Higher stock for popular sizes (M, L)

### Example 2: Electronics Store

**Laptop with Specs**

Option Types:

- RAM: 8GB, 16GB, 32GB
- Storage: 256GB SSD, 512GB SSD, 1TB SSD
- Color: Silver, Space Gray

Configuration:

- **Variants**: 18 combinations (3 RAM × 3 Storage × 2 Colors)
- **SKU Pattern**: `LAPTOP-{RAM}-{Storage}-{Color}`
- **Base Price**: $999
- **Price Increments**:
  - +$100 per RAM tier
  - +$150 per storage tier
- **Stock**: Limited quantities, track serials with barcodes

### Example 3: Coffee Shop

**Coffee Bags**

Option Types:

- Roast: Light, Medium, Dark
- Size: 12oz, 1lb, 5lb
- Grind: Whole Bean, Espresso, Drip, French Press

Configuration:

- **Variants**: 36 combinations (3 roasts × 3 sizes × 4 grinds)
- **SKU Pattern**: `COFFEE-{Roast}-{Size}-{Grind}`
- **Base Price**: $12.99
- **Price Scaling**: +$10 per size tier
- **Stock**: High volume, automatic reorder triggers

### Example 4: Custom Products

**Made-to-Order Items**

Option Types:

- Material: Cotton, Polyester, Bamboo
- Size: Custom (S-XXL)
- Customization: Embroidered Name

Configuration:

- **Variants**: 3 base materials with size modifiers
- **SKU**: Manual entry per order
- **Pricing**: Formula-based (material cost + customization fee)
- **Stock**: Made to order (stock = 0, but always available)
- **Lead Time**: 2-3 weeks

---

## API Reference

### ProductVariant Model

```typescript
interface ProductVariant {
  id: string; // Unique identifier (CUID)
  productId: string; // Parent product
  name: string; // Display name
  sku: string | null; // Stock Keeping Unit (unique)
  barcode: string | null; // Barcode for scanning
  price: Decimal | null; // Variant-specific price
  stockQuantity: number; // Current inventory (default: 0)
  options: JsonValue | null; // { "Size": "L", "Color": "Red" }
  isActive: boolean; // Visible to customers (default: true)
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modified timestamp

  // Relations
  product: Product;
  cartItems: CartItem[];
  orderItems: OrderItem[];
}
```

### Component Props

#### VariantSelector

```typescript
interface VariantSelectorProps {
  variants: ProductVariant[]; // Active variants to choose from
  onVariantChange?: (variant: ProductVariant | null) => void;
  defaultVariantId?: string; // Pre-select variant
  style?: "dropdown" | "buttons"; // UI style (default: "buttons")
  className?: string;
}
```

#### ProductVariantList

```typescript
interface ProductVariantListProps {
  productId: string;
  variants: ProductVariant[];
  onEdit?: (variant: ProductVariant) => void;
  onDelete?: () => void;
  className?: string;
}
```

#### BulkVariantGenerator

```typescript
interface BulkVariantGeneratorProps {
  productId: string;
  productSku?: string; // Base SKU for generation
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}
```

#### VariantQuickEditModal

```typescript
interface VariantQuickEditModalProps {
  productId: string;
  variants: ProductVariant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

---

## Best Practices

### 1. SKU Management

- **Always use unique SKUs** for inventory tracking
- **Auto-generate SKUs** for consistency
- **Include product code** in pattern for easy identification
- **Use meaningful separators** (hyphens are standard)

### 2. Pricing Strategy

- **Set base price** at product level for fallback
- **Use variant prices** for actual variations
- **Show price ranges** on listings ($19.99 - $49.99)
- **Update prices in bulk** for seasonal changes

### 3. Inventory Management

- **Track stock** at variant level, not product level
- **Set low stock thresholds** (typically 5-10 units)
- **Use bulk adjustments** for restocking
- **Monitor low stock** variants regularly

### 4. Option Configuration

- **Limit option count** (max 3-4 types for usability)
- **Order options logically** (Size, Color, Material)
- **Use consistent naming** across products
- **Avoid too many combinations** (stay under 100)

### 5. Customer Experience

- **Disable unavailable options** instead of hiding
- **Show stock status** prominently
- **Update price immediately** on selection
- **Display selected options** clearly in cart

### 6. Data Integrity

- **Never delete ordered variants** (deactivate instead)
- **Validate combinations** before generation
- **Check SKU uniqueness** before saving
- **Prevent negative stock** in adjustments

---

## Troubleshooting

### Variant Not Showing in Selector

**Issue**: Customer can't see or select a variant

**Solutions**:

1. Check `isActive` field - must be `true`
2. Verify `stockQuantity` > 0 (or allow backorders)
3. Ensure variant options match expected format
4. Confirm product itself is active

### SKU Conflicts

**Issue**: Cannot save variant due to duplicate SKU

**Solutions**:

1. Make SKUs unique across all variants
2. Use auto-generation with proper patterns
3. Check for typos in manual SKUs
4. Update existing variant's SKU first

### Price Not Updating

**Issue**: Selected variant price doesn't change

**Solutions**:

1. Verify variant has a price set (not null)
2. Check variant selector `onVariantChange` callback
3. Ensure price is properly formatted (Decimal → number)
4. Confirm variant is found by selected options

### Bulk Generation Fails

**Issue**: Too many combinations or errors

**Solutions**:

1. Reduce option values (max 100 combinations)
2. Check for existing combinations (use preview)
3. Verify SKU pattern doesn't create duplicates
4. Ensure product exists and is accessible

### Stock Validation Errors

**Issue**: Can't add variant to cart despite showing stock

**Solutions**:

1. Refresh variant data (may be stale)
2. Check actual database stock quantity
3. Verify cart action uses `isVariantAvailable()`
4. Confirm no concurrent orders depleted stock

---

## Future Enhancements

### Potential Additions

- **Variant Images**: Specific images per variant (e.g., color photos)
- **Weight/Dimensions**: Shipping calculations per variant
- **Import/Export**: CSV bulk operations
- **Variant Groups**: Logical grouping of variants
- **Price Rules**: Dynamic pricing based on quantity or customer type
- **Inventory Alerts**: Email notifications for low stock
- **Supplier Integration**: Auto-reorder from suppliers
- **Analytics**: Best-selling variants reporting

---

## Summary

The Product Variants system is a complete solution for managing product variations with:

- ✅ **Full CRUD Operations** - Create, read, update, delete variants
- ✅ **Bulk Generation** - Auto-create from option combinations
- ✅ **Quick Editing** - Batch price/stock updates
- ✅ **Smart Selection** - Customer-facing variant picker
- ✅ **Inventory Tracking** - Real-time stock management
- ✅ **Cart Integration** - Seamless cart and checkout flow
- ✅ **Order Protection** - Prevents data loss from ordered variants
- ✅ **Type Safety** - Full TypeScript and Zod validation
- ✅ **Developer Friendly** - 25+ utility functions and comprehensive API

For questions or issues, refer to the code documentation in the respective files or contact the development team.

---

**Last Updated**: October 5, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
