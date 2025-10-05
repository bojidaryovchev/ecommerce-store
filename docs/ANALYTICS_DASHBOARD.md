# Analytics Dashboard

A comprehensive business intelligence dashboard for the e-commerce store, providing real-time insights into revenue, orders, products, and customers.

## Features

### 📊 Key Performance Indicators (KPIs)

- **Total Revenue**: Track revenue with period-over-period comparison
- **Total Orders**: Monitor order volume and growth
- **Average Order Value (AOV)**: Measure customer spending patterns
- **Products Sold**: Track total units sold across all orders

### 📈 Revenue Analytics

- **Time-series Revenue Chart**: Visualize revenue trends over time
- **Time Grouping Options**: View data by hour, day, week, or month
- **Period Comparison**: Compare current period with previous period
- **Revenue by Status**: Breakdown revenue by order status

### 🛍️ Order Analytics

- **Order Status Distribution**: Pie chart showing order breakdown by status
- **Order Metrics**: Counts for pending, processing, shipped, delivered, cancelled, and refunded orders
- **Recent Orders**: Quick view of latest orders

### 🏆 Product Performance

- **Top Products Table**: Interactive table showing best-performing products
- **Sortable Columns**: Sort by revenue, units sold, or order count
- **Direct Links**: Quick navigation to product pages
- **Performance Rankings**: Visual badges for top 3 products

### 👥 Customer Insights

- **Total Customers**: Track customer base growth
- **New vs Returning**: Understand customer acquisition and retention
- **Average Lifetime Value (LTV)**: Measure long-term customer value
- **Retention Rate**: Calculate percentage of returning customers
- **New Customer Rate**: Track customer acquisition percentage

### 📅 Date Range Flexibility

- **Preset Ranges**: Today, Yesterday, Last 7/30/90 days, This Month, Last Month
- **Custom Date Ranges**: Select any date range with calendar picker
- **Automatic Comparisons**: Previous period calculated automatically

## Architecture

### Backend Components

#### 1. Analytics Utilities (`src/lib/analytics-utils.ts`)

Core calculation functions for all analytics metrics:

**Key Functions:**

- `getDateRangePreset(preset)`: Convert preset strings to date ranges
- `getComparisonRange(range)`: Calculate previous period for comparison
- `calculateRevenueOverTime(range, grouping)`: Generate revenue time-series data
- `getOrderMetrics(range)`: Calculate order statistics by status
- `getTopProducts(range, limit, sortBy)`: Get best-performing products
- `getCustomerMetrics(range)`: Calculate customer acquisition and retention
- `getOrderStatusDistribution(range)`: Get order breakdown by status
- `calculatePercentageChange(current, previous)`: Calculate period-over-period change

**Helper Functions:**

- `formatCurrency(value)`: Format numbers as currency
- `formatNumber(value)`: Format numbers with commas
- `formatPercentage(value)`: Format decimals as percentages

#### 2. Server Actions

Admin-only endpoints for fetching analytics data:

**`get-revenue-analytics.action.ts`**

- `getRevenueAnalytics(data)`: Revenue time-series with optional comparison
- `getRevenueSummary(data)`: Summary metrics with period-over-period changes

**`get-product-analytics.action.ts`**

- `getProductAnalytics(data)`: Top products by revenue or units

**`get-customer-analytics.action.ts`**

- `getCustomerAnalytics(data)`: Customer metrics with comparison

**`get-order-analytics.action.ts`** (pre-existing)

- `getOrderStats(days)`: Order statistics for specified period
- `getRevenueByStatus(days)`: Revenue grouped by order status
- `getRecentOrders(limit)`: Latest orders with details

### Frontend Components

#### 1. Core Components (`src/components/admin/`)

**`analytics-dashboard.tsx`**
Main dashboard container with state management and data orchestration.

**`analytics-kpi-card.tsx`**
Reusable KPI card component with:

- Title and value display
- Optional icon
- Trend indicators (up/down/neutral)
- Percentage change
- Subtitle support

**`analytics-revenue-chart.tsx`**
Line chart for revenue visualization:

- Time-series revenue data
- Comparison overlay support
- Custom tooltips with AOV and order count
- Responsive design
- Time grouping support

**`analytics-order-status-chart.tsx`**
Pie chart for order distribution:

- Color-coded status segments
- Percentage labels
- Interactive legend
- Hover tooltips

**`analytics-top-products-table.tsx`**
Sortable product performance table:

- Rank badges (1-3 highlighted)
- Sortable columns (revenue, units, orders)
- Product links
- Formatted currency and numbers

**`analytics-customer-insights.tsx`**
Customer metrics widget:

- Four key metrics with icons
- Period comparison
- Retention and acquisition rates
- Visual metric cards

**`analytics-date-range-selector.tsx`**
Date range picker with:

- Preset dropdown
- Custom date range calendar
- Responsive design

## Database Schema

### Indexed Fields for Performance

The following indexes optimize analytics queries:

**Order Model:**

```prisma
@@index([status])              // Filter by order status
@@index([createdAt])           // Filter by date
@@index([status, createdAt])   // Combined filter (compound index)
```

**OrderItem Model:**

```prisma
@@index([productId])           // Product performance queries
```

These indexes ensure fast analytics queries even with large datasets.

## Usage

### Accessing the Dashboard

1. Navigate to `/admin/analytics`
2. Admin role required (ADMIN in user.roles)
3. Dashboard loads with default "Last 30 Days" view

### Selecting Date Ranges

**Using Presets:**

1. Click the date range dropdown
2. Select a preset (Today, Yesterday, Last 7/30/90 days, This Month, Last Month)
3. Dashboard automatically refreshes

**Using Custom Range:**

1. Select "Custom Range" from dropdown
2. Click the date picker button
3. Select start and end dates from calendar
4. Dashboard refreshes with selected range

### Viewing Revenue Trends

1. Navigate to "Revenue" tab (default)
2. Select time grouping:
   - Daily: Best for short-term trends (1-30 days)
   - Weekly: Good for medium-term (30-90 days)
   - Monthly: Ideal for long-term trends (90+ days)
3. Toggle "Compare Periods" to overlay previous period
4. Hover over chart for detailed tooltips

### Analyzing Products

1. Navigate to "Products" tab
2. View top 10 products by default
3. Click column headers to sort:
   - Revenue (default)
   - Units Sold
   - Orders
4. Click product name to view product page

### Understanding Customer Metrics

1. Navigate to "Customers" tab
2. View four key metrics:
   - Total Customers
   - New Customers
   - Returning Customers
   - Average Lifetime Value
3. Check retention and acquisition rates at bottom
4. Period comparison shows growth/decline

### Monitoring Orders

1. Navigate to "Orders" tab
2. View order distribution pie chart
3. See breakdown by status:
   - Pending (Yellow)
   - Processing (Blue)
   - Shipped (Purple)
   - Delivered (Green)
   - Cancelled (Red)
   - Refunded (Orange)

## Technical Implementation

### State Management

The dashboard uses React hooks for state:

- `dateRange`: Current selected date range
- `preset`: Selected preset or "custom"
- `timeGrouping`: Chart grouping (day/week/month)
- `showComparison`: Toggle for period comparison
- `isLoading`: Loading state for API calls

### Data Flow

1. User selects date range → `dateRange` state updates
2. `useEffect` triggers → `fetchAnalytics()` called
3. Parallel API calls fetch all analytics data
4. State updates with results
5. Components re-render with new data

### Error Handling

All server actions include try-catch blocks:

- Admin authentication check
- Database query error handling
- Graceful error messages returned
- Console logging for debugging

### Performance Optimizations

1. **Database Indexes**: Fast query execution
2. **Parallel Fetching**: Multiple API calls simultaneously
3. **Client-side Sorting**: No server round-trip for table sorting
4. **Memoized Calculations**: Format functions reuse results
5. **Time Grouping**: Reduces data points for large date ranges

## API Reference

### Date Range Presets

| Preset       | Description                   |
| ------------ | ----------------------------- |
| `today`      | Current day (midnight to now) |
| `yesterday`  | Previous day (full 24 hours)  |
| `last7days`  | Last 7 complete days          |
| `last30days` | Last 30 complete days         |
| `last90days` | Last 90 complete days         |
| `thisMonth`  | Current month (1st to now)    |
| `lastMonth`  | Previous complete month       |

### Time Grouping Options

| Grouping | Best For             | Example             |
| -------- | -------------------- | ------------------- |
| `hour`   | Same-day analysis    | Hourly sales trends |
| `day`    | Weekly/monthly views | Daily revenue       |
| `week`   | Quarterly views      | Weekly performance  |
| `month`  | Yearly views         | Monthly comparison  |

## Dependencies

- **recharts**: Chart visualization library
- **date-fns**: Date manipulation and formatting
- **Prisma**: Database queries and ORM
- **Next.js**: Server actions and routing
- **shadcn/ui**: UI components (Card, Button, Table, etc.)

## Future Enhancements

Potential additions to the analytics dashboard:

1. **Export Functionality**: Download analytics as CSV/PDF
2. **Scheduled Reports**: Email reports on schedule
3. **Custom Dashboards**: User-configurable widgets
4. **Real-time Updates**: WebSocket for live data
5. **Advanced Filters**: Category, product type, customer segment
6. **Forecasting**: Predictive analytics for revenue and orders
7. **Conversion Funnel**: Track customer journey
8. **Cohort Analysis**: Customer retention by signup period
9. **Inventory Insights**: Stock turnover and reorder points
10. **Marketing Attribution**: Track campaign performance

## Troubleshooting

### Dashboard Not Loading

1. Check admin role: User must have "ADMIN" in roles array
2. Verify database connection: Ensure Prisma client is connected
3. Check console for errors: Open browser DevTools

### Slow Performance

1. Verify indexes: Run `prisma db push` to ensure indexes exist
2. Reduce date range: Large ranges (>1 year) may be slow
3. Increase time grouping: Use "month" for long periods
4. Check database: Ensure sufficient resources

### Data Not Updating

1. Click refresh button (↻) to manually refresh
2. Clear browser cache
3. Check if orders exist in selected date range
4. Verify order statuses are set correctly

### Charts Not Displaying

1. Ensure recharts is installed: `npm install recharts`
2. Check browser console for errors
3. Verify data format matches component props
4. Try different browser

## Security

- **Admin-only Access**: All analytics endpoints check for ADMIN role
- **Server-side Calculations**: No sensitive logic in client code
- **SQL Injection Prevention**: Prisma parameterized queries
- **Rate Limiting**: Consider adding for production (not implemented)

## Testing

### Manual Testing Checklist

- [ ] Load dashboard as admin user
- [ ] Verify all KPI cards display correctly
- [ ] Test each date range preset
- [ ] Test custom date range selection
- [ ] Switch between time groupings
- [ ] Toggle period comparison
- [ ] Sort products table by each column
- [ ] Click product links
- [ ] View each tab (Revenue, Orders, Products, Customers)
- [ ] Test with no data (empty database)
- [ ] Test with large dataset (1000+ orders)
- [ ] Verify mobile responsiveness

### Edge Cases

- **No Orders**: Dashboard should show empty states
- **Single Order**: Calculations should handle division by 1
- **Same Period Comparison**: 0% changes displayed
- **Large Numbers**: Currency and number formatting works
- **Long Product Names**: Table cells should truncate/wrap
- **Missing Product Images**: Graceful fallback

## Maintenance

### Regular Tasks

1. **Monitor Query Performance**: Check slow query log
2. **Update Indexes**: Add indexes if new queries are slow
3. **Verify Calculations**: Spot-check analytics accuracy
4. **Review Error Logs**: Check for failed analytics requests
5. **Update Dependencies**: Keep recharts and date-fns current

### Data Integrity

- Order totals must match: `total = subtotal + taxAmount + shippingAmount - discountAmount`
- OrderItem totalPrice must match: `totalPrice = unitPrice * quantity`
- Customer counts: New + Returning should equal Total
- Revenue calculations: Sum of order totals with specific status filter

## Support

For issues or questions:

1. Check this documentation
2. Review Troubleshooting section
3. Check console logs for errors
4. Verify database schema matches documentation
5. Test with sample data

---

**Last Updated**: Feature implementation completed  
**Version**: 1.0.0  
**Status**: Production Ready
