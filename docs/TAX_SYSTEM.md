# Tax Calculation System

A comprehensive tax calculation system that supports multiple tax types (Sales Tax, VAT, GST) with location-based rates and flexible configuration options.

## Features

### 🧮 Tax Calculation

- **Multiple Tax Types**: Sales Tax (US), VAT (EU), GST/HST (Canada), Tax-Exempt
- **Location-Based Rates**: Country, State/Province, City, and Postal Code level granularity
- **Hierarchical Lookup**: Finds most specific tax rate (postal code > city > state > country)
- **Date-Based Rates**: Support for effective dates and expiration dates
- **Priority System**: Higher priority rates override lower ones for the same location

### ⚙️ Configuration Options

- **Enable/Disable**: Toggle tax calculation system-wide
- **Display Mode**: Inclusive (tax included in prices) or Exclusive (tax added at checkout)
- **Rounding**: Round up, down, or to nearest cent
- **Default Rate**: Fallback rate when no specific rate is found
- **Tax Exemptions**: Product-level and category-level tax exemptions

### 🌍 Location Support

- **United States**: State-level sales tax with city and postal code support
- **Canada**: GST/HST/PST support at provincial level
- **European Union**: VAT support for all countries
- **Custom Regions**: Add any country/region with custom rates

### 📊 Admin Features

- **Tax Rate Management**: Create, update, delete tax rates
- **Bulk Import**: Import tax rates from CSV
- **Filtering**: Filter rates by country, state, type, status
- **Priority Control**: Set rate priority for overlapping jurisdictions
- **Active/Inactive**: Enable or disable rates without deletion

## Architecture

### Database Model

**TaxRate Model** (`prisma/schema.prisma`):

```prisma
model TaxRate {
  id String @id @default(cuid())

  // Location identifiers
  country    String  // ISO 3166-1 alpha-2 (e.g., "US", "CA", "GB")
  state      String? // State/province code
  city       String? // City name
  postalCode String? // Postal/ZIP code

  // Tax details
  rate        Decimal // Tax rate as decimal (e.g., 0.0825 for 8.25%)
  type        TaxType
  name        String
  description String?

  // Effective dates
  startDate DateTime?
  endDate   DateTime?

  // Priority and status
  priority Int     @default(1)
  isActive Boolean @default(true)

  @@unique([country, state, city, postalCode])
  @@index([country])
  @@index([country, state])
}
```

**TaxType Enum**:

- `SALES_TAX` - US state and local sales tax
- `VAT` - European Value Added Tax
- `GST` - Canadian Goods and Services Tax / Harmonized Sales Tax
- `EXEMPT` - Tax-exempt location or product

### Core Components

#### 1. Configuration (`src/lib/tax-config.ts`)

Defines tax types, configuration structure, and predefined rates:

**Key Interfaces**:

- `TaxRate`: Individual tax rate definition
- `TaxConfiguration`: System-wide tax settings
- `TaxType`: Enum for tax types
- `TaxDisplayMode`: INCLUSIVE or EXCLUSIVE

**Predefined Rates**:

- US States: CA (7.25%), NY (4%), TX (6.25%), FL (6%)
- Canada: ON (13% HST), BC (12% GST+PST)
- EU: GB (20%), DE (19%), FR (20%)

**Helper Functions**:

- `getTaxTypeLabel(type)`: Get display name for tax type
- `formatTaxRate(rate)`: Format rate as percentage
- `isTaxExemptLocation(country, state)`: Check if location is exempt
- `getTaxRateKey(...)`: Generate cache key for rates

#### 2. Calculator (`src/lib/tax-calculator.ts`)

Core calculation logic with support for inclusive/exclusive tax:

**Main Functions**:

- `getTaxRate(country, state?, city?, postalCode?, date?)`: Find applicable tax rate
- `calculateTax(input)`: Calculate tax for amount and location
- `applyTax(price, location)`: Quick tax calculation
- `calculateCartTax(items, location)`: Calculate tax for multiple items
- `roundTaxAmount(amount, mode, precision)`: Apply rounding rules

**Tax Calculation Logic**:

- **Exclusive**: Tax added to price (`total = price + (price * rate)`)
- **Inclusive**: Tax extracted from price (`base = price / (1 + rate)`)
- **Rounding**: Configurable up/down/nearest with precision

#### 3. Server Actions

**`src/actions/tax-rate.action.ts`** - Tax Rate CRUD:

- `createTaxRate(data)`: Create new tax rate
- `updateTaxRate(id, data)`: Update existing rate
- `deleteTaxRate(id)`: Delete rate
- `getTaxRates(filters?)`: Query rates with filtering
- `getTaxRateById(id)`: Get single rate
- `bulkImportTaxRates(rates)`: Import multiple rates

**`src/actions/calculate-checkout-tax.action.ts`** - Checkout Tax:

- `calculateCheckoutTax(items, addressId)`: Calculate tax for checkout
- `getTaxRateForAddress(addressId)`: Get rate for specific address

**`src/actions/get-cart.action.ts`** - Cart Integration:

- Updated to calculate tax based on user's default address
- Returns tax breakdown in cart summary

## Usage

### Admin Configuration

#### 1. Configure Tax Settings

Navigate to `/admin/settings/tax` and configure:

**General Settings Tab**:

1. **Enable Tax Calculation**: Toggle to enable/disable tax system-wide
2. **Price Display Mode**:
   - **Exclusive (US)**: Tax added at checkout, prices shown without tax
   - **Inclusive (EU)**: Tax included in displayed prices
3. **Default Tax Rate**: Set fallback rate (e.g., 0.08 for 8%)
4. **Rounding Mode**: Choose how to round tax amounts
5. **Show Tax Breakdown**: Display detailed tax information to customers

#### 2. Add Tax Rates

**Tax Rates Tab**:

**Add Single Rate**:

1. Click "Add Tax Rate" button
2. Fill in form:
   - **Country**: Required (ISO code like "US")
   - **State**: Optional (e.g., "CA", "NY")
   - **City**: Optional
   - **Postal Code**: Optional (for very specific rates)
   - **Rate**: Tax rate as percentage (e.g., 8.25)
   - **Type**: Sales Tax, VAT, GST, or Exempt
   - **Name**: Display name (e.g., "California Sales Tax")
   - **Priority**: Higher numbers override lower (default: 1)
3. Click "Save"

**Bulk Import from CSV**:

1. Click "Import CSV" button
2. Upload CSV with columns:
   - country, state, city, postalCode, rate, type, name, description
3. Rates are imported with skipDuplicates (won't error on conflicts)

**Example CSV**:

```csv
country,state,rate,type,name
US,CA,0.0725,SALES_TAX,California Sales Tax
US,NY,0.04,SALES_TAX,New York Sales Tax
CA,ON,0.13,GST,Ontario HST
GB,,0.20,VAT,UK VAT
```

#### 3. Manage Existing Rates

- **Edit**: Click pencil icon to update rate details
- **Delete**: Click trash icon to remove rate
- **Filter**: Use dropdowns to filter by country, state, type, status
- **Toggle Active**: Enable/disable rates without deleting

### Programmatic Usage

#### Calculate Tax in Code

```typescript
import { calculateTax, getTaxRate } from "@/lib/tax-calculator";

// Calculate tax for a single amount
const result = await calculateTax({
  amount: 100,
  country: "US",
  state: "CA",
  city: "Los Angeles",
  postalCode: "90001",
  productId: "optional-for-exemptions",
  categoryId: "optional-for-exemptions",
});

console.log(result);
// {
//   baseAmount: 100,
//   taxRate: 0.0725,
//   taxAmount: 7.25,
//   totalAmount: 107.25,
//   taxType: "SALES_TAX",
//   taxName: "California Sales Tax",
//   isExempt: false
// }

// Get tax rate for a location
const taxRate = await getTaxRate("US", "CA", "Los Angeles", "90001");
console.log(taxRate);
// {
//   country: "US",
//   state: "CA",
//   rate: 0.0725,
//   type: "SALES_TAX",
//   name: "California Sales Tax",
//   isActive: true
// }
```

#### Calculate Cart Tax

```typescript
import { calculateCartTax } from "@/lib/tax-calculator";

const result = await calculateCartTax(
  [
    { price: 50, quantity: 2, productId: "prod_1" }, // $100 total
    { price: 25, quantity: 1, productId: "prod_2" }, // $25 total
  ],
  "US",
  "CA",
);

console.log(result);
// {
//   items: [...], // Tax breakdown per item
//   totalBaseAmount: 125,
//   totalTaxAmount: 9.06,
//   totalAmount: 134.06
// }
```

#### Checkout Integration

```typescript
import { calculateCheckoutTax } from "@/actions/calculate-checkout-tax.action";

const result = await calculateCheckoutTax({
  items: [
    { productId: "prod_1", variantId: "var_1", quantity: 2, price: 50 },
    { productId: "prod_2", quantity: 1, price: 25 },
  ],
  shippingAddressId: "addr_123",
});

if (result.success) {
  // Use result.data.totalTaxAmount when creating order
  const order = await prisma.order.create({
    data: {
      // ... other fields
      taxAmount: result.data.totalTaxAmount,
      taxRate: result.data.taxRate,
      // ...
    },
  });
}
```

### Customer-Facing Display

#### Product Pages

Display tax information based on configuration:

**Exclusive Mode** (US):

```
Price: $99.99
Tax: Calculated at checkout based on your location
```

**Inclusive Mode** (EU):

```
Price: $99.99 (incl. VAT)
```

#### Cart Summary

```
Subtotal:     $125.00
Shipping:     $10.00
Tax:          $9.80 (7.25% CA Sales Tax)
─────────────────────
Total:        $144.80
```

#### Checkout

- Tax calculated when shipping address is selected
- Updates dynamically if address changes
- Shows tax rate and type
- Displays tax breakdown clearly

## Tax Rate Lookup Logic

The system uses hierarchical lookup to find the most specific tax rate:

1. **Postal Code Match**: If rate exists for exact postal code → use it
2. **City Match**: If rate exists for city + state → use it
3. **State Match**: If rate exists for state → use it
4. **Country Match**: If rate exists for country → use it
5. **Default**: Use configured default rate
6. **None**: No tax applied (rate = 0)

### Priority System

When multiple rates match at the same specificity level:

- Higher priority number wins
- Example: Priority 5 overrides Priority 1

### Effective Dates

- **Start Date**: Rate only applies on or after this date
- **End Date**: Rate stops applying after this date
- If no dates specified, rate is always active (if `isActive = true`)

## Configuration Examples

### United States Setup

```typescript
// California with county-level rates
await createTaxRate({
  country: "US",
  state: "CA",
  rate: 0.0725, // 7.25% state rate
  type: "SALES_TAX",
  name: "California State Tax",
  priority: 1,
});

// Los Angeles County additional rate
await createTaxRate({
  country: "US",
  state: "CA",
  city: "Los Angeles",
  rate: 0.095, // 9.5% total (state + county)
  type: "SALES_TAX",
  name: "Los Angeles Sales Tax",
  priority: 2, // Higher priority, overrides state rate
});

// Tax-exempt state
await createTaxRate({
  country: "US",
  state: "OR",
  rate: 0,
  type: "EXEMPT",
  name: "Oregon - No Sales Tax",
});
```

### European Union VAT

```typescript
// Standard VAT rates
const euCountries = [
  { country: "GB", rate: 0.2, name: "UK VAT" },
  { country: "DE", rate: 0.19, name: "Germany VAT" },
  { country: "FR", rate: 0.2, name: "France VAT" },
  { country: "ES", rate: 0.21, name: "Spain VAT" },
  { country: "IT", rate: 0.22, name: "Italy VAT" },
];

await bulkImportTaxRates(
  euCountries.map((c) => ({
    ...c,
    type: "VAT",
    priority: 1,
  })),
);
```

### Canada GST/HST

```typescript
// Harmonized Sales Tax (HST) provinces
await createTaxRate({
  country: "CA",
  state: "ON",
  rate: 0.13, // 13% HST
  type: "GST",
  name: "Ontario HST",
});

// GST + PST provinces
await createTaxRate({
  country: "CA",
  state: "BC",
  rate: 0.12, // 5% GST + 7% PST
  type: "GST",
  name: "British Columbia GST+PST",
});
```

## Tax Exemptions

### Product Exemptions

Certain products can be marked as tax-exempt:

```typescript
// In tax configuration
const taxConfig = {
  taxExemptProducts: ["prod_abc123", "prod_xyz789"],
  // ...
};

// These products will have 0% tax regardless of location
```

### Category Exemptions

Entire product categories can be exempt:

```typescript
const taxConfig = {
  taxExemptCategories: ["cat_food", "cat_medicine"],
  // ...
};

// All products in these categories are tax-exempt
```

### Location Exemptions

Some locations have no sales tax:

- Oregon (OR)
- Alaska (AK)
- Delaware (DE)
- Montana (MT)
- New Hampshire (NH)

These are handled automatically by the `isTaxExemptLocation()` function.

## API Reference

### TaxCalculationInput

```typescript
interface TaxCalculationInput {
  amount: number; // Base price before tax
  country: string; // ISO 3166-1 alpha-2
  state?: string; // State/province code
  city?: string; // City name
  postalCode?: string; // Postal/ZIP code
  productId?: string; // For product exemption check
  categoryId?: string; // For category exemption check
}
```

### TaxCalculationResult

```typescript
interface TaxCalculationResult {
  baseAmount: number; // Original amount
  taxRate: number; // Applied rate (0.0725 = 7.25%)
  taxAmount: number; // Calculated tax
  totalAmount: number; // Base + tax
  taxType: TaxType; // SALES_TAX, VAT, GST, EXEMPT
  taxName: string; // Display name
  isExempt: boolean; // Whether tax was exempted
}
```

## Troubleshooting

### Tax Not Being Applied

1. **Check if tax is enabled**: Admin Settings > Tax > Enable Tax Calculation
2. **Verify tax rate exists**: Admin Settings > Tax > Tax Rates tab
3. **Check address**: Ensure user has a default address set
4. **Review exemptions**: Check if product/category is tax-exempt
5. **Inspect logs**: Check server logs for tax calculation errors

### Wrong Tax Rate Applied

1. **Check location specificity**: More specific rates override general ones
2. **Review priority**: Higher priority rates win
3. **Verify effective dates**: Ensure rate is within startDate/endDate range
4. **Check active status**: Rate must be active (`isActive = true`)

### Tax Calculation Errors

1. **Invalid rate**: Rate must be between 0 and 1 (0% to 100%)
2. **Missing address**: Cart tax requires user's default address
3. **Database connection**: Verify Prisma connection is working
4. **Cache issues**: Call `clearTaxConfigCache()` to reset

### Rounding Discrepancies

- Ensure rounding mode is consistent
- Default is "NEAREST" with 2 decimal places
- Change in Admin Settings > Tax > Tax Rounding

## Performance Considerations

### Caching

- Tax configuration is cached for 1 minute in memory
- Clear cache with `clearTaxConfigCache()` after updates
- Database queries use indexed fields for fast lookup

### Indexes

The following database indexes optimize tax rate queries:

```prisma
@@index([country])
@@index([country, state])
@@index([isActive])
@@index([startDate, endDate])
```

### Query Optimization

- Hierarchical lookup stops at first match (most specific)
- Priority sorting ensures correct rate selection
- Date filtering done in database, not in application

## Security

- **Admin Only**: All tax management requires ADMIN role
- **Address Verification**: calculateCheckoutTax verifies address ownership
- **Input Validation**: Rates validated to be between 0 and 1
- **SQL Injection Prevention**: Prisma parameterized queries
- **No Client Secrets**: Tax logic runs server-side only

## Testing

### Manual Testing Checklist

- [ ] Create tax rate for your region
- [ ] Verify cart shows correct tax
- [ ] Test with different addresses (different states/countries)
- [ ] Verify tax-exempt products show $0 tax
- [ ] Test with tax disabled (should show no tax)
- [ ] Try inclusive vs exclusive display modes
- [ ] Test rounding with different modes
- [ ] Bulk import CSV with multiple rates
- [ ] Edit and delete rates
- [ ] Filter rates by country/state/type

### Test Cases

**Case 1: US State Sales Tax**

- Location: California (US-CA)
- Expected: 7.25% tax applied
- Product: $100 → Tax: $7.25 → Total: $107.25

**Case 2: Tax-Exempt Location**

- Location: Oregon (US-OR)
- Expected: 0% tax
- Product: $100 → Tax: $0 → Total: $100

**Case 3: EU VAT (Inclusive)**

- Location: United Kingdom (GB)
- Expected: 20% VAT included in price
- Display Price: £100 (incl. VAT) → Base: £83.33, VAT: £16.67

**Case 4: Hierarchical Lookup**

- Rates: US (0%), US-CA (7.25%), US-CA-LA (9.5%)
- Location: Los Angeles, CA
- Expected: 9.5% tax (most specific rate)

## Future Enhancements

Potential improvements to the tax system:

1. **Tax API Integration**: Connect to TaxJar, Avalara, or similar for real-time rates
2. **Nexus Management**: Track economic nexus for sales tax compliance
3. **Tax Reporting**: Generate tax liability reports for filing
4. **Automatic Filing**: Submit sales tax returns automatically (advanced)
5. **Multi-Currency**: Support tax calculation in multiple currencies
6. **Tax Holidays**: Support temporary tax exemptions (e.g., back-to-school)
7. **Product-Specific Rates**: Different rates for food, clothing, etc.
8. **Digital Goods Tax**: Special handling for digital products
9. **Reverse Charge VAT**: B2B transactions in EU
10. **Tax Certificates**: Upload and manage tax exemption certificates

## Support

For issues or questions:

1. Check this documentation
2. Review Troubleshooting section
3. Verify tax configuration in admin panel
4. Check server logs for errors
5. Test with simple case (single product, known rate)

---

**Last Updated**: Feature implementation completed  
**Version**: 1.0.0  
**Status**: Production Ready
