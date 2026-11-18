# Rewriting the supplier's product descriptions

The product descriptions come from the supplier (hydrotermbg.com), word for word. Google treats
copied text as duplicate content, so the site stays out of search (`SITE_INDEXING` off) until the
descriptions are the shop's own. `packages/supplier-sync/src/rewrite` does that with Claude, one
product per request.

## What it does

- Takes every product whose description is still the supplier's (no `description` lock).
- Sends Claude the name, brand, category, specifications and the supplier's text, and gets back a
  Bulgarian description and a meta description (structured output, model `claude-opus-5-5`).
- Refuses a result that is too short or repeats eight words in a row from the supplier's text.
- Saves the description, keeps the meta description in `product.metadata.metaDescription` (the
  product page uses it), and locks the description: the 4-hourly supplier sync stops overwriting it
  and reports supplier changes to it in the review queue instead.

Server-side fallbacks are on: if a safety classifier declines a request, the API retries it on a
fallback model it chooses (`fallbacks: "default"`).

## Running it

Needs `DATABASE_URL` and `ANTHROPIC_API_KEY` (or an `ant auth login` profile), from the shell or the
repo's `.env`.

```bash
# See what would be sent for one product; calls nothing
pnpm --filter @ecommerce/supplier-sync rewrite --preview

# Rewrite five and print them; saves nothing. Read them before going further.
pnpm --filter @ecommerce/supplier-sync rewrite --limit 5 --dry-run

# One category, saved
pnpm --filter @ecommerce/supplier-sync rewrite --category termopompi-monoblok

# Everything left (about 390 products), 4 at a time
pnpm --filter @ecommerce/supplier-sync rewrite
```

A run can be repeated: saved products are skipped, failed ones are tried again. With `SITE_URL` and
`SUPPLIER_SYNC_SECRET` set, the CLI asks the live site to refresh the rewritten pages
(`POST /api/revalidate`); otherwise they refresh on the next deploy or catalog sync.

Cost, roughly: about 2,000 input and 700 output tokens per product, so about $8 for the whole
catalogue at Claude Opus 5.5 prices ($4 / $20 per million tokens).

## Before turning indexing on

1. Read a sample in the admin: a few products from each category.
2. Run the plugin's near-duplicate check (`compare-pages.mjs` with `--source` pointing at the
   supplier's pages) on a sample of product pages.
3. Set `SITE_INDEXING=on` for the production build and redeploy.
