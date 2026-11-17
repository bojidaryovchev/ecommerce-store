# Supplier Catalog Sync

Our catalog is imported from the supplier's shop, [hydrotermbg.com](https://hydrotermbg.com) (Хидро Терм), and kept in sync: products, categories, prices, stock, photos and specifications. We can still edit any product. Edited fields stop following the supplier.

Code: [`packages/supplier-sync`](../packages/supplier-sync). Admin: **Admin → Supplier sync** (`/admin/supplier-sync`).

## How it works

```mermaid
flowchart LR
    A[Supplier WooCommerce<br/>public API] -->|every 4 h: edit times<br/>nightly: everything| B[supplier_product<br/>raw snapshot + hash]
    B --> C{changed?}
    C -->|no| D[nothing to do]
    C -->|yes| E[normalise:<br/>names, brand, prices,<br/>stock, specs]
    E --> F{field locked<br/>by us?}
    F -->|no| G[update our product]
    F -->|yes| H[review queue]
    E -->|new product or<br/>price move > 10%| H
    H -->|admin decides| G
```

- **Source.** The supplier runs WooCommerce. Its public Store API (`/wp-json/wc/store/v1`) and `wp/v2/product` listing need no key. A full download takes about eight requests. We do not scrape HTML.
- **Schedule.**
  - Every 4 hours, an _incremental_ run lists every product's last edit time and downloads only new or edited products.
  - Every night at 01:30 UTC, a _full_ run downloads every product. It catches stock changes that don't update the edit time.
  - Both are triggered by the `ecommerce-supplier-sync-*` EventBridge rules and Lambda (`infra/`). They call `POST /api/supplier-sync`.
- **New products** arrive as drafts (unpublished) and wait in the review queue. **Publish all new** publishes them in one click.
- **Prices** are the supplier's retail price, VAT included, in EUR.
  - A move of up to ±10% from our current price applies automatically.
  - Larger moves, and a price appearing on a "price on request" product, wait for review. Until then we keep selling at our current price.
  - If the supplier drops a price, the product stops being purchasable immediately.
- **Stock.** Out of stock at the supplier sets `trackInventory = true` and `stockQuantity = 0` on ours, so the storefront and checkout block the purchase. In stock or on backorder makes it purchasable.
- **Removed products.**
  - A product missing from two consecutive runs is unpublished and logged.
  - If it reappears, it waits for review before being published again.
  - If the supplier's listing suddenly shrinks below half of what we track, the run stops and unpublishes nothing.
- **Categories and attributes.** A category or attribute seen for the first time gets a matching one of ours: Bulgarian name, Latin slug, nested like the supplier's. After that, the mapping is ours to change (`supplier_category.category_id`, `supplier_attribute.attribute_id`). "Uncategorized" and the supplier's promo bucket ("ТОП ОФЕРТИ") get no category.
- **Clean-up on import.**
  - Mixed Cyrillic/Latin look-alike letters are fixed ("Аrtel" → "Artel").
  - The brand is taken from the name. There is a known-brand list in `src/normalize/brand.ts`.
  - HTML descriptions become plain text.
  - Spec values like "13000 BTU/h" or "700 W" get a numeric value for range filters, with W converted to kW where the attribute is in kW.
- **Photos** still load from the supplier's server (allowed in `next.config.ts`). Copying them to our S3 bucket is the next step: pass an `ImageStore` to the sync.

## Our edits ("locks")

When an admin edits name, description, images, category, brand, price or stock on a synced product, that field is added to `product.locked_fields`. The sync then leaves it alone. If the supplier later changes that field, the change shows up in the review queue as "Supplier changed a field we edited". The product page in admin lists the locked fields. **Follow supplier again** removes a lock and restores the supplier's value.

## Running it yourself

```bash
# First import into a database (DATABASE_URL from the repo-root .env):
pnpm --filter @ecommerce/supplier-sync sync --full            # products arrive as drafts for review
pnpm --filter @ecommerce/supplier-sync sync --full --publish  # or publish everything immediately

# Later runs:
pnpm --filter @ecommerce/supplier-sync sync                   # incremental
```

Or press **Sync now** / **Full refresh** in the admin. A full run of ~390 products takes about a minute.

## Configuration

| Where                   | Name                          | Value                         |
| ----------------------- | ----------------------------- | ----------------------------- |
| Vercel and `.env.local` | `SUPPLIER_SYNC_SECRET`        | Long random string            |
| Pulumi (each stack)     | `supplierSyncSecret` (secret) | The same string               |
| Pulumi (each stack)     | `appUrl`                      | The site URL the Lambda calls |

```bash
cd infra
pulumi config set --secret supplierSyncSecret "<same value as SUPPLIER_SYNC_SECRET>" --stack dev
```

## Tests

```bash
pnpm --filter @ecommerce/supplier-sync test
```

The end-to-end test needs a disposable, migrated Postgres on localhost. Its tables are truncated:

```bash
docker run -d --name ecom-sync-pg -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=ecommerce -p 55432:5432 postgres:17-alpine
DATABASE_URL=postgres://postgres:devpass@localhost:55432/ecommerce pnpm db:migrate
SUPPLIER_SYNC_TEST_DATABASE_URL=postgres://postgres:devpass@localhost:55432/ecommerce pnpm --filter @ecommerce/supplier-sync test
```

## Tables

| Table                                  | Holds                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| `supplier`                             | Suppliers we sync (one today)                                                        |
| `supplier_product`                     | Latest raw API payload per supplier product, its hash, and the link to our `product` |
| `supplier_category`                    | Supplier categories → our `category`                                                 |
| `supplier_attribute`                   | Supplier attributes → our `attribute`                                                |
| `attribute`, `product_attribute_value` | Specifications for product pages and filters (`numeric_value` for ranges)            |
| `sync_run`                             | Log of every run: mode, trigger, counts, errors                                      |
| `sync_change`                          | Review queue (pending) and change history (applied / dismissed)                      |
