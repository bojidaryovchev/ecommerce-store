# Inventory Management & Low Stock Alerts

**Feature Complete** ✅  
**Implementation Date:** January 2025  
**Status:** Production Ready

## Overview

The Inventory Management system provides automated stock monitoring, configurable alerts, and comprehensive inventory tracking for both products and variants. The system automatically monitors stock levels and sends notifications when items require restocking.

## Features

### 1. **Stock Monitoring Service**

- Real-time stock level tracking for products and variants
- Configurable low stock thresholds per product
- Four stock status levels:
  - **In Stock** - Above threshold
  - **Low Stock** - Below threshold but above critical
  - **Critical** - At or below critical threshold (default: 1 unit)
  - **Out of Stock** - Zero inventory

### 2. **Automated Alerts**

- Email notifications for low, critical, and out-of-stock items
- Alerts triggered automatically when stock falls below thresholds
- Consolidated or separate alerts by severity
- Beautiful HTML email templates with product details
- Plain text fallback for all email clients

### 3. **Admin Dashboard Widget**

- Real-time inventory health summary
- Color-coded status indicators
- Recently updated items list
- Quick navigation to inventory management
- Action buttons for immediate attention items

### 4. **Inventory Management Page**

- Comprehensive view of all low stock items
- Filter by status: all, low-stock, critical, out-of-stock
- Filter by type: products vs variants
- Search functionality
- Bulk actions and individual adjustments
- Quick threshold updates
- Export to CSV

### 5. **Scheduled Stock Checks**

- Automated periodic inventory monitoring
- Configurable check intervals
- Dry run mode for testing
- Health check endpoints
- Comprehensive logging

### 6. **Settings & Configuration**

- Global default thresholds
- Email notification preferences
- Alert frequency settings
- Test email functionality
- System status monitoring

## File Structure

```
src/
├── lib/
│   ├── stock-monitor.ts                  # Core stock monitoring logic
│   ├── email-notifications.ts            # Email alert system
│   └── cron/
│       └── check-stock-levels.ts         # Scheduled checks
├── actions/
│   ├── get-low-stock-items.action.ts     # Stock alert actions
│   └── adjust-variant-stock.action.ts    # Stock adjustment (integrated)
├── components/
│   └── admin/
│       └── low-stock-widget.tsx          # Dashboard widget
└── app/
    └── (admin)/
        └── admin/
            ├── inventory/
            │   └── page.tsx              # Inventory management page
            └── settings/
                └── inventory/
                    └── page.tsx          # Settings page
```

## Database Schema

The system uses existing database fields:

### Product Model

```prisma
model Product {
  // ... other fields
  stockQuantity     Int       @default(0)
  lowStockThreshold Int?      @default(5)
}
```

### ProductVariant Model

```prisma
model ProductVariant {
  // ... other fields
  stockQuantity Int @default(0)
  product       Product @relation(...)
}
```

**Note:** Variants inherit the `lowStockThreshold` from their parent product.

## Usage Guide

### Setting Up Stock Alerts

#### 1. Configure Product Thresholds

When creating or editing a product:

```typescript
// In create-product-modal.tsx
<Input
  id="lowStockThreshold"
  type="number"
  min="0"
  placeholder="e.g., 10"
  defaultValue={5}
/>
```

#### 2. Configure Global Settings

Navigate to **Admin → Settings → Inventory**:

- Set default threshold for new products (default: 5)
- Set critical threshold (default: 1)
- Enable/disable email alerts
- Configure recipient email addresses
- Set check interval (5-1440 minutes)

#### 3. Monitor Inventory

Navigate to **Admin → Inventory**:

- View all low stock items
- Filter by status or type
- Search for specific products
- Adjust stock levels
- Update thresholds
- Export reports

### Programmatic Usage

#### Checking Stock Status

```typescript
import { checkProductNeedsRestock, getStockStatus } from "@/lib/stock-monitor";

// Check if a product needs restocking
const status = await checkProductNeedsRestock("product-id");
if (status?.needsRestock) {
  console.log(`Stock status: ${status.status}`); // 'low-stock', 'critical', 'out-of-stock'
}

// Get stock status for a quantity
const stockStatus = getStockStatus(3, 5); // (quantity, threshold)
// Returns: 'low-stock'
```

#### Getting Low Stock Items

```typescript
import { getLowStockItems } from "@/actions/get-low-stock-items.action";

// Get all low stock items
const result = await getLowStockItems({
  includeOutOfStock: true,
});

if (result.success) {
  console.log(`Found ${result.items.length} items needing attention`);
}
```

#### Adjusting Stock with Alerts

```typescript
import { adjustVariantStock } from "@/actions/adjust-variant-stock.action";

// Adjust stock (triggers alert if threshold crossed)
const result = await adjustVariantStock({
  id: "variant-id",
  adjustment: -10, // Decrease by 10
  reason: "Order fulfillment",
});

if (result.success && result.stockAlert) {
  console.log(`Alert triggered: ${result.stockAlert}`);
}
```

#### Sending Manual Alerts

```typescript
import { sendLowStockAlert } from "@/lib/email-notifications";

const items = [
  {
    type: "product",
    id: "prod-1",
    productId: "prod-1",
    productName: "Test Product",
    productSlug: "test-product",
    stockQuantity: 3,
    threshold: 5,
    status: "low-stock",
    lastUpdated: new Date(),
  },
];

await sendLowStockAlert(items, {
  recipientEmail: "admin@example.com",
  recipientName: "Admin",
});
```

### Setting Up Automated Checks

#### Option 1: Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-stock",
      "schedule": "0 * * * *"
    }
  ]
}
```

Create API route at `app/api/cron/check-stock/route.ts`:

```typescript
import { checkStockLevels } from "@/lib/cron/check-stock-levels";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await checkStockLevels({
    sendAlerts: true,
    consolidate: false,
    minItemsForAlert: 1,
  });

  return Response.json(result);
}
```

#### Option 2: Node Cron

```typescript
import cron from "node-cron";
import { checkStockLevels } from "@/lib/cron/check-stock-levels";

// Run every hour
cron.schedule("0 * * * *", async () => {
  console.log("Running stock check...");
  await checkStockLevels();
});
```

#### Option 3: External Cron Service

Use services like:

- Cron-job.org
- EasyCron
- AWS CloudWatch Events

Configure to call your API endpoint hourly.

## Email Configuration

### Environment Variables

Add to `.env` or `.env.local`:

```bash
# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
ADMIN_EMAILS=admin1@yourdomain.com,admin2@yourdomain.com

# App URL for email links
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Cron job security
CRON_SECRET=your-secure-random-string
```

### Email Service Integration

Update `src/lib/email-notifications.ts` to integrate with your email provider:

#### Resend Example

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(options: EmailNotificationOptions) {
  await resend.emails.send({
    from: config.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  return true;
}
```

#### SendGrid Example

```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendEmail(options: EmailNotificationOptions) {
  await sgMail.send({
    from: config.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  return true;
}
```

## API Reference

### Stock Monitoring Functions

#### `getStockStatus(quantity: number, threshold: number): StockStatus`

Determine stock status based on quantity and threshold.

#### `getLowStockProducts(options?: StockMonitorOptions): Promise<LowStockItem[]>`

Get all products below their threshold.

#### `getLowStockVariants(options?: StockMonitorOptions): Promise<LowStockItem[]>`

Get all variants below their threshold.

#### `getAllLowStockItems(options?: StockMonitorOptions): Promise<LowStockItem[]>`

Get all low stock items (products + variants).

#### `getLowStockCounts(): Promise<StockCounts>`

Get count of items by status category.

### Server Actions

#### `getLowStockItems(options?): Promise<{ success: boolean; items?: LowStockItem[] }>`

Get all low stock items via server action.

#### `getStockAlertSummary(): Promise<{ success: boolean; summary?: AlertSummary }>`

Get dashboard summary with counts and recent updates.

#### `updateProductStockThreshold(data): Promise<{ success: boolean }>`

Update the low stock threshold for a product.

#### `bulkUpdateStockThresholds(data): Promise<{ success: boolean }>`

Update thresholds for multiple products at once.

### Email Functions

#### `sendLowStockAlert(items: LowStockItem[], options?): Promise<Result>`

Send low stock alert email.

#### `sendCriticalStockAlert(items: LowStockItem[], options?): Promise<Result>`

Send critical stock alert email.

#### `sendOutOfStockAlert(items: LowStockItem[], options?): Promise<Result>`

Send out of stock alert email.

#### `sendConsolidatedStockAlert(low, critical, outOfStock, options?): Promise<Result>`

Send one email with all alert levels.

#### `sendTestStockAlert(recipientEmail: string): Promise<Result>`

Send test alert to verify configuration.

### Cron Functions

#### `checkStockLevels(config?: StockCheckConfig): Promise<StockCheckResult>`

Main function to check stock and send alerts.

#### `performStockCheck(): Promise<{ success: boolean; message: string }>`

Quick check for API routes.

#### `healthCheck(): Promise<{ healthy: boolean; itemsMonitored: number }>`

Verify the system is working.

#### `getStockCheckStatus(): Promise<StatusInfo>`

Get current status and statistics.

## Testing

### Manual Testing

1. **Create a test product** with low stock:

   ```
   Stock Quantity: 3
   Low Stock Threshold: 5
   ```

2. **Navigate to Inventory page** - should appear in low stock list

3. **Test email** in Settings → Inventory → Send Test Email

4. **Adjust stock** to trigger alerts:
   - Decrease to 1 → Critical alert
   - Decrease to 0 → Out of stock alert

### Automated Testing

```typescript
// Example test
import { checkProductNeedsRestock } from "@/lib/stock-monitor";

describe("Stock Monitoring", () => {
  it("should detect low stock", async () => {
    const result = await checkProductNeedsRestock("test-product-id");
    expect(result?.needsRestock).toBe(true);
    expect(result?.status).toBe("low-stock");
  });
});
```

## Troubleshooting

### Alerts Not Sending

1. **Check email configuration:**
   - Verify `EMAIL_FROM` environment variable
   - Verify `ADMIN_EMAILS` is set
   - Check email service integration in `email-notifications.ts`

2. **Check settings:**
   - Navigate to Settings → Inventory
   - Verify "Enable Stock Alerts" is ON
   - Verify "Email Notifications" is ON

3. **Test email manually:**
   - Use "Send Test Email" button
   - Check server logs for errors

### Items Not Appearing in Inventory Page

1. **Check thresholds:**
   - Product must have stock below threshold
   - Default threshold is 5
   - Verify in product edit modal

2. **Check active status:**
   - Only active products/variants show by default
   - Use filter to include inactive items

### Cron Job Not Running

1. **Verify configuration:**
   - Check Vercel cron config in `vercel.json`
   - Verify API route exists
   - Check `CRON_SECRET` environment variable

2. **Test manually:**

   ```bash
   curl -X GET https://yourdomain.com/api/cron/check-stock \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Check logs:**
   - View Vercel function logs
   - Look for `[Stock Check]` prefixed messages

## Performance Considerations

- **Database queries** are optimized with proper indexes on:
  - `Product.lowStockThreshold`
  - `Product.stockQuantity`
  - `ProductVariant.stockQuantity`
  - `Product.isActive`

- **Email batching**: Critical alerts sent first, then out-of-stock, then low-stock

- **Caching**: Consider caching stock counts for dashboard widget (5-minute TTL)

- **Rate limiting**: Email alerts have built-in delay to avoid spam

## Future Enhancements

Potential improvements for future iterations:

- [ ] Stock alert history tracking (separate database model)
- [ ] SMS/Push notifications
- [ ] Auto-reorder suggestions
- [ ] Supplier integration
- [ ] Predictive restocking based on sales velocity
- [ ] Multi-location inventory tracking
- [ ] Barcode scanning for stock updates
- [ ] Mobile app for inventory management

## Support

For issues or questions:

- Review this documentation
- Check the troubleshooting section
- Review code comments in implementation files
- Contact development team

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Feature Status:** Production Ready ✅
