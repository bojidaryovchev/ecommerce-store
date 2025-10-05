# Real-time Order Status Tracking Implementation

## Overview

This document describes the real-time order status tracking system implemented using Server-Sent Events (SSE) with automatic polling fallback. The system provides live updates when order statuses change, with visual progress tracking and notifications.

## Architecture

### Technology Stack

- **Primary Protocol**: Server-Sent Events (SSE) over HTTP
- **Fallback**: Polling every 10 seconds (configurable)
- **Event Broadcasting**: Node.js EventEmitter
- **Notifications**: react-hot-toast
- **Authentication**: NextAuth.js with RBAC

### Key Components

1. **Order Events System** (`src/lib/order-events.ts`)
2. **SSE Streaming Endpoint** (`src/app/api/orders/[orderId]/stream/route.ts`)
3. **Status Update Hook** (`src/hooks/use-order-status.ts`)
4. **Visual Tracker Component** (`src/components/order-status-tracker.tsx`)
5. **Timeline Component** (`src/components/order-timeline.tsx`)

## Implementation Details

### 1. Order Events System

**File**: `src/lib/order-events.ts`

Central event broadcasting system for order status changes.

**Key Features**:

- EventEmitter-based architecture
- Type-safe event handling
- Status transition validation
- Status display information (labels, colors, descriptions)

**Usage**:

```typescript
import { orderEvents, emitOrderUpdate } from "@/lib/order-events";

// Emit an order update
emitOrderUpdate({
  orderId: "123",
  userId: "user-456",
  status: "SHIPPED",
  previousStatus: "PROCESSING",
  timestamp: new Date(),
  note: "Package shipped via FedEx",
});

// Listen for updates
orderEvents.onOrderUpdate(orderId, (event) => {
  console.log("Order updated:", event);
});
```

**Status Transitions**:

```
PENDING → PROCESSING → SHIPPED → DELIVERED
         ↓            ↓
    CANCELLED    REFUNDED
```

### 2. SSE Streaming Endpoint

**File**: `src/app/api/orders/[orderId]/stream/route.ts`

Server-Sent Events endpoint for real-time order updates.

**Features**:

- Authentication required (session check)
- Ownership verification (users can only view their orders, admins can view all)
- Heartbeat every 30 seconds to maintain connection
- Automatic cleanup on disconnect
- CORS headers for SSE compatibility

**Response Format**:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"connected","message":"Connected to order updates"}

data: {"type":"order-updated","orderId":"123","status":"SHIPPED","previousStatus":"PROCESSING","timestamp":"2024-01-01T12:00:00Z","note":"Shipped"}

: heartbeat
```

**Authentication Flow**:

1. Check for valid session
2. Fetch order from database
3. Verify ownership (order.userId === session.user.id OR user.role === 'ADMIN')
4. Return 401/403/404 if unauthorized
5. Establish SSE stream if authorized

### 3. Order Status Hook

**File**: `src/hooks/use-order-status.ts`

React hook for consuming real-time order updates with automatic fallback.

**Features**:

- Attempts SSE connection first
- Falls back to polling on SSE failure
- Configurable polling interval (default: 10 seconds)
- Toast notifications for status changes
- Custom callbacks for status changes
- Connection status tracking

**Usage**:

```tsx
import { useOrderStatus } from "@/hooks/use-order-status";

function OrderComponent({ orderId, initialStatus }) {
  const { status, isConnected, connectionType, lastUpdate } = useOrderStatus(orderId, initialStatus, {
    enableNotifications: true,
    pollingInterval: 10000,
    onStatusChange: (update) => {
      console.log("Status changed:", update);
    },
  });

  return (
    <div>
      <p>Status: {status}</p>
      <p>
        Connected: {isConnected ? "Yes" : "No"} ({connectionType})
      </p>
      {lastUpdate && <p>Last update: {lastUpdate.toLocaleString()}</p>}
    </div>
  );
}
```

**Connection Strategy**:

```
1. Try EventSource (SSE)
   ↓
2a. Success → Use SSE
   ↓
2b. Error → Fallback to polling
   ↓
3. Polling: Fetch /api/orders/[orderId] every 10s
```

### 4. Order Status Tracker Component

**File**: `src/components/order-status-tracker.tsx`

Visual progress indicator showing order status with live updates.

**Features**:

- 4-step progress bar: PENDING → PROCESSING → SHIPPED → DELIVERED
- Animated icons for each step
- Live connection badge (SSE/Polling indicator)
- Last update timestamp
- Special handling for CANCELLED and REFUNDED states
- Tracking number display when shipped
- Responsive design with Tailwind animations

**Visual Indicators**:

- 🕐 Clock icon = PENDING
- 📦 Package icon = PROCESSING
- 🚚 Truck icon = SHIPPED
- ✓ Check icon = DELIVERED
- ❌ X icon = CANCELLED
- 💲 Dollar icon = REFUNDED

**Usage**:

```tsx
import { OrderStatusTracker } from "@/components/order-status-tracker";

<OrderStatusTracker order={order} />;
```

### 5. Order Timeline Component

**File**: `src/components/order-timeline.tsx`

Chronological display of order status history.

**Features**:

- Vertical timeline layout
- Shows status transitions with arrows
- Timestamps for each change
- Optional notes for each status change
- "Latest" badge on most recent entry
- Color-coded status indicators
- Empty state when no history

**Usage**:

```tsx
import { OrderTimeline } from "@/components/order-timeline";

<OrderTimeline history={order.statusHistory} />;
```

### 6. Integration with Order Details Modal

**File**: `src/components/order-details-modal.tsx`

The order details modal now includes:

- Real-time OrderStatusTracker at the top of the details tab
- OrderTimeline showing full status history
- Removed old static status history section

**Changes Made**:

```tsx
<TabsContent value="details" className="space-y-6 pt-4">
  {/* Real-time Order Status Tracker */}
  <OrderStatusTracker order={order} />

  {/* Order Timeline */}
  <OrderTimeline history={order.statusHistory} />

  {/* ... rest of order details ... */}
</TabsContent>
```

## Notification System

### Toast Notifications

Enhanced notifications using react-hot-toast with:

**Features**:

- Status transition display (e.g., "Processing → Shipped")
- Custom icons based on status (📦 for general updates, ✅ for delivered)
- Optional notes displayed separately
- 5-second duration for status updates
- 4-second duration for notes

**Examples**:

```
📦 Order status updated: Processing → Shipped
ℹ️ Package shipped via FedEx
✅ Order status updated: Shipped → Delivered
```

### Notification Options

The `useOrderStatus` hook accepts notification options:

```typescript
enableNotifications: boolean  // Default: true
onStatusChange: (update) => void  // Custom callback
```

## Security

### Authentication & Authorization

**SSE Endpoint Security**:

1. Session required (NextAuth)
2. Order ownership validation
3. Admin role can view all orders
4. Regular users can only view their own orders

**Error Responses**:

- `401 Unauthorized`: No valid session
- `403 Forbidden`: User doesn't own order and is not admin
- `404 Not Found`: Order doesn't exist

### Connection Security

- No sensitive data in SSE stream
- Only status updates broadcast
- Full order details require separate API call
- CORS headers properly configured
- XSS protection via proper content-type

## Performance Considerations

### SSE vs Polling

**SSE (Primary)**:

- Pros: Low latency, efficient, real-time
- Cons: Requires persistent connection, may not work through some proxies

**Polling (Fallback)**:

- Pros: Universal compatibility, simple
- Cons: Higher latency, more server requests

### Optimization Strategies

1. **Heartbeat Interval**: 30 seconds to keep connection alive
2. **Polling Interval**: 10 seconds (configurable)
3. **Event Filtering**: Only emit events for specific orders
4. **Automatic Cleanup**: Close connections when components unmount
5. **Single Connection**: One SSE connection per order view

### Scalability

For production deployments with many concurrent users:

**Recommended Approach**:

- Use Redis Pub/Sub for multi-server event broadcasting
- Implement sticky sessions for SSE connections
- Consider managed SSE services (e.g., Pusher, Ably) for large scale
- Set connection limits per user

**Redis Integration** (optional):

```typescript
// Publish order update
redisClient.publish(`order:${orderId}`, JSON.stringify(event));

// Subscribe to order updates
redisClient.subscribe(`order:${orderId}`);
```

## Testing

### Manual Testing

1. **Test SSE Connection**:
   - Open order details in browser
   - Check Network tab for `/stream` connection
   - Verify EventStream type
   - Update order status from admin panel
   - Confirm real-time update in UI

2. **Test Polling Fallback**:
   - Disable EventSource in browser DevTools
   - Open order details
   - Verify polling requests in Network tab
   - Update order status
   - Confirm update within 10 seconds

3. **Test Notifications**:
   - Open order details
   - Update order status with note
   - Verify toast notifications appear
   - Check for both status and note toasts

### Automated Testing

**Unit Tests** (recommended):

```typescript
describe("useOrderStatus", () => {
  it("should connect via SSE", () => {
    // Mock EventSource
    // Assert connection established
  });

  it("should fallback to polling on SSE error", () => {
    // Mock EventSource with error
    // Assert polling interval started
  });

  it("should show notifications on status change", () => {
    // Mock status update
    // Assert toast.success called
  });
});
```

**Integration Tests** (recommended):

```typescript
describe("Order Details Modal", () => {
  it("should display real-time status updates", async () => {
    // Render modal with order
    // Trigger status update
    // Assert UI updates
  });
});
```

## Troubleshooting

### Common Issues

**SSE Connection Fails**:

- Check browser console for errors
- Verify session is valid
- Confirm order exists and user has access
- Check for proxy/firewall blocking SSE

**Polling Not Working**:

- Verify API route `/api/orders/[orderId]` exists
- Check for 401/403 errors
- Confirm order data format matches expected type

**No Notifications**:

- Check `enableNotifications` option is true
- Verify react-hot-toast is properly configured
- Check browser console for toast errors

**Stale Connection**:

- Check heartbeat is being sent (every 30s)
- Verify browser hasn't put tab to sleep
- Confirm event listeners are properly attached

### Debug Mode

Enable debug logging:

```typescript
// In useOrderStatus hook
console.log("[SSE] Connected to order", orderId);
console.log("[SSE] Message received:", data);
console.log("[SSE] Falling back to polling");
```

## Future Enhancements

### Potential Improvements

1. **Browser Notifications**:
   - Request Notification API permission
   - Send browser notifications for status changes
   - Configurable in user preferences

2. **WebSocket Support**:
   - Implement WebSocket as primary protocol
   - Fallback to SSE if WebSocket unavailable
   - Bi-directional communication for advanced features

3. **Delivery Tracking Map**:
   - Integration with shipping carrier APIs
   - Real-time delivery tracking on map
   - Estimated delivery time updates

4. **Email Notifications**:
   - Send email on status changes
   - Configurable email preferences
   - Rich HTML templates

5. **SMS Notifications**:
   - Integration with Twilio/SNS
   - SMS alerts for key status changes
   - Opt-in system with phone verification

6. **Order Status Analytics**:
   - Track average time between status changes
   - Identify bottlenecks in fulfillment
   - Generate reports for admins

## Conclusion

The real-time order status tracking system provides a robust, scalable solution for keeping customers informed about their orders. The SSE + Polling architecture ensures maximum compatibility while maintaining low latency updates. The system is fully integrated into the existing order management workflow and requires no additional infrastructure.

For questions or issues, please refer to the troubleshooting section or contact the development team.
