# Database Validators

Auto-generated Zod schemas from Drizzle tables for runtime validation.

## Usage

### Import Schemas

```typescript
import {
  createCustomerSchema,
  selectCustomerSchema,
  createPaymentIntentSchema,
  insertProductSchema,
  StripeWebhookEvent,
} from "@ecommerce/database/validators";
```

### Validate API Input

```typescript
// API route handler
export async function POST(req: Request) {
  const body = await req.json();

  // Validate with Zod
  const validatedData = createPaymentIntentSchema.parse(body);

  // Now safely use validatedData with TypeScript types
  const paymentIntent = await db.insert(paymentIntents).values(validatedData);
}
```

### Validate Stripe Webhooks

```typescript
import { stripeWebhookEventSchema } from "@ecommerce/database/validators";

export async function POST(req: Request) {
  const body = await req.json();

  // Validate webhook structure
  const event = stripeWebhookEventSchema.parse(body);

  switch (event.type) {
    case "payment_intent.succeeded":
      // Handle payment success
      break;
  }
}
```

### Type-Safe Forms

```typescript
import { createCustomerSchema } from "@ecommerce/database/validators";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function CustomerForm() {
  const form = useForm({
    resolver: zodResolver(createCustomerSchema),
  });

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Available Schemas

### Pattern

Each table has 3 auto-generated schemas:

- **`insert{Table}Schema`** - For inserting (includes all fields)
- **`select{Table}Schema`** - For querying (return type)
- **`update{Table}Schema`** - For updates (all fields optional except ID)

Plus custom **`create{Table}Schema`** variants that omit auto-generated fields.

### Stripe Entities

- **Customers**: `createCustomerSchema`, `selectCustomerSchema`, `updateCustomerSchema`
- **Products**: `createProductSchema`, `selectProductSchema`, `updateProductSchema`
- **Prices**: `insertPriceSchema`, `selectPriceSchema`, `updatePriceSchema`
- **PaymentIntents**: `createPaymentIntentSchema`, `selectPaymentIntentSchema`
- **Charges**: `insertChargeSchema`, `selectChargeSchema`
- **PaymentMethods**: `insertPaymentMethodSchema`, `selectPaymentMethodSchema`
- **Subscriptions**: `createSubscriptionSchema`, `selectSubscriptionSchema`
- **Invoices**: `insertInvoiceSchema`, `selectInvoiceSchema`
- **Refunds**: `insertRefundSchema`, `selectRefundSchema`
- **And all other Stripe entities...**

### E-Commerce Entities

- **Orders**: `insertOrderSchema`, `selectOrderSchema`
- **Carts**: `insertCartSchema`, `selectCartSchema`
- **Products**: `insertProductSchema`, `selectProductSchema`
- **Categories**: `insertCategorySchema`, `selectCategorySchema`
- **Reviews**: `insertReviewSchema`, `selectReviewSchema`

### Auth Entities

- **Users**: `insertUserSchema`, `selectUserSchema`, `updateUserSchema`
- **Accounts**: `insertAccountSchema`, `selectAccountSchema`
- **Sessions**: `insertSessionSchema`, `selectSessionSchema`

## Custom Refinements

You can extend/refine the auto-generated schemas:

```typescript
import { createPaymentIntentSchema } from "@ecommerce/database/validators";
import { z } from "zod";

const myCustomSchema = createPaymentIntentSchema.extend({
  amount: z.number().int().min(50, "Minimum amount is $0.50"),
  metadata: z.object({
    orderId: z.string().uuid(),
  }),
});
```

## Benefits

✅ **Auto-generated** - Schemas automatically match your database structure  
✅ **Type-safe** - Full TypeScript inference from Zod schemas  
✅ **Runtime validation** - Catch invalid data before DB operations  
✅ **Form validation** - Use with React Hook Form, Formik, etc.  
✅ **API validation** - Validate request bodies in API routes  
✅ **Webhook validation** - Validate Stripe webhook payloads  
✅ **Zero maintenance** - Update Drizzle schema = Zod schemas auto-update
