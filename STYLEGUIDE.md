# Style Guide

Concise conventions for the ecommerce-store codebase.

---

## Project Structure

```
apps/web/          → Next.js 16 app (App Router)
packages/database/ → Drizzle ORM schema, relations, validators, client
```

- **Monorepo** managed by pnpm workspaces.
- Import the database package as `@ecommerce/database`.
- Internal app imports use `@/` alias (maps to `apps/web/src/`).

---

## File & Folder Naming

- **kebab-case** for all files and folders: `get-products.query.ts`, `cart-context.tsx`.
- **Suffix by role**:
  - Queries: `*.query.ts`
  - Mutations: `*.mutation.ts`
  - Types: `*.type.ts`
  - Components: `component-name.tsx` inside a folder of the same name.
- **Barrel exports** via `index.ts` in every module folder.
- Component folder structure:
  ```
  components/
    products/
      products-grid/
        products-grid.tsx
        index.ts
        product-card/
          product-card.tsx
          index.ts
  ```

---

## TypeScript

- Strict mode. No `any`.
- Prefer `type` over `interface` for object shapes.
- Use `import type` for type-only imports.
- Define types once in canonical locations; re-export from barrel files — never duplicate.
- Drizzle inferred types (`typeof schema.table.$inferSelect`) live in `packages/database/src/types/`.
- App-level composed types (e.g., `ProductWithPrices`) live in `apps/web/src/types/`.

---

## Next.js 16

### Middleware (`proxy.ts`)

- Next.js 16 renames `middleware.ts` → `proxy.ts`.
- Wraps `auth()` from NextAuth for session access.
- Matcher **excludes** `/api` routes — API routes must handle their own auth.
- Protects `/admin/*` routes with role checks.

### Pages & Layouts

- Every page exports `metadata` (or `generateMetadata` for dynamic).
- Server Components by default. Add `"use client"` only when needed.
- Use `loading.tsx` for Suspense boundaries — delegate to shared skeleton components, never duplicate skeleton markup.
- Use `not-found.tsx` with `notFound()` for missing resources.

### Route Handlers (API)

- Located in `app/api/`.
- Not protected by `proxy.ts` — add explicit auth checks via `auth()`.
- Return `NextResponse.json(...)` with appropriate status codes.

---

## Caching

### Queries — `"use cache"` + `cacheTag()`

```ts
"use cache";

import { cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

async function getProducts() {
  cacheTag(CACHE_TAGS.products);
  // ...query
}
```

- Every cached query starts with `"use cache"` directive.
- Tag with the broadest collection tag + specific entity tag(s).
- All tag constants live in `@/lib/cache-tags.ts`.

### Mutations — `revalidateTag()` with `"max"`

```ts
revalidateTag(CACHE_TAGS.products, "max");
revalidateTag(CACHE_TAGS.product(id), "max");
```

- Always pass `"max"` staleness for instant invalidation.
- Invalidate both the collection tag and specific entity tag(s).
- Cross-entity: if a mutation affects another domain's cached query, invalidate that tag too (e.g., price changes invalidate `products`).

### Cart — `React.cache()` (no `"use cache"`)

```ts
import { cache } from "react";

const getCartByUserId = cache(async (userId: string) => { ... });
```

- Cart is user-specific and high-mutation — no cross-request caching.
- `React.cache()` deduplicates within a single request only.
- Cart state is managed client-side via React Context; never use `revalidatePath` for cart.

---

## Server Actions (Mutations)

```ts
"use server";

import type { ActionResult } from "@/types/action-result.type";

async function doSomething(data: Input): Promise<ActionResult<Output>> {
  try {
    // ...mutate
    revalidateTag(CACHE_TAGS.relevant, "max");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed" };
  }
}
```

- Always return `ActionResult<T>` — never throw from server actions.
- Wrap body in try/catch; log with `console.error`.
- Start with `"use server"` directive.
- Actions invoked only from `proxy.ts`-protected pages do **not** need their own auth checks.

---

## Authentication

- **NextAuth v5** with Google OAuth, JWT strategy, DrizzleAdapter.
- `auth()` from `@/lib/auth` returns the session.
- Role check pattern:

  ```ts
  import { auth } from "@/lib/auth";
  import { UserRole } from "@ecommerce/database/schema";

  const session = await auth();
  const isAdmin = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.SUPER_ADMIN;
  ```

- `UserRole` is imported from `@ecommerce/database/schema` — it is both a type and a runtime object.
- Call `auth()` once per request boundary and pass the session down as props.

---

## Database (Drizzle)

- All tables in `packages/database/src/tables/`, one file per table.
- All relations in `packages/database/src/relations/`, one file per table.
- Enums in `packages/database/src/enums/`.
- Validators (Zod schemas) in `packages/database/src/validators.ts`.
- IDs: `text` primary keys with `crypto.randomUUID()`.
- Timestamps: every table has `createdAt` + `updatedAt` (both `timestamp` with `defaultNow()`).
- Soft deletes: products use `active: boolean`, categories use `deletedAt: timestamp`.
- Foreign keys: set appropriate `onDelete` — `cascade` for owned children, `set null` for referenced entities.

---

## Components

- **Server Components** for data fetching. **Client Components** (`"use client"`) only for interactivity.
- UI primitives in `components/ui/` (shadcn).
- Domain components grouped by feature: `components/products/`, `components/cart/`, etc.
- Shared skeletons in `components/common/skeletons/`.
- Props: define inline or in the same file. Suffix with `Props`:
  ```ts
  type ProductCardProps = { product: ProductWithPrices };
  ```
- Accept optional customization props (e.g., `emptyMessage?: string`) for reusable components.

---

## Imports

- Ordered: external packages → `@ecommerce/*` → `@/` aliases → relative.
- Use path aliases exclusively — no `../../../`.
- Barrel imports from index files: `import { getProducts } from "@/queries"`.

---

## Error Handling

- Server actions: return `ActionResult`, never throw.
- API routes: return `NextResponse.json({ error }, { status })`.
- Client: use `react-hot-toast` for user-facing feedback.
- Always log errors server-side with `console.error`.

---

## Stripe

- SDK version: v20+ — use `collected_information.shipping_details` (not top-level `shipping_details`).
- Webhook route at `/api/webhooks/stripe/` — verify signature, switch on `event.type`.
- Store Stripe IDs with `.unique()` constraints.
- Order items snapshot product/price data at purchase time (`productSnapshot`, `priceSnapshot` as JSONB).

---

## Image Uploads

- Presigned URL flow: client → `/api/upload/presigned-url` → S3 direct upload.
- Upload tracking: `uploads` table with `status` enum (`pending` → `linked` → `deleted`).
- `linkUpload`/`linkUploads` on entity create/update; `unlinkUploads` on entity delete.
- Orphaned uploads (pending > 24h) cleaned by Lambda on a daily cron.
- Upload API routes require admin auth (not covered by `proxy.ts`).
