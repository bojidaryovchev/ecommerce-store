# Handoff — start here

Read this file, then `docs/handoff/plan.md`, and work through the plan in order. Status as of 2026-11-18.

## The project

A Bulgarian online shop for heating and cooling units. It resells hydrotermbg.com's catalogue, kept in step by the
supplier sync, and installs the units turnkey. Repo `d:\repos\ecommerce-store`, a pnpm monorepo:

- `apps/web`: Next.js 16.4 App Router with Cache Components (`"use cache"`, prerendered shells), next-intl
  (Bulgarian at the root, English under `/en`), Tailwind v4, shadcn/Radix, GSAP.
  **Read `apps/web/AGENTS.md`**: this Next.js differs from your training, so read `node_modules/next/dist/docs/`
  before writing Next code.
- `packages/database`: Drizzle on Neon Postgres, migrations in `drizzle/`.
- `packages/supplier-sync`: WooCommerce Store API sync, curation (`src/curation.ts`), review queue, and the
  description rewrite CLI (`src/rewrite/`).
- `packages/mailbox`: the admin mailbox (Resend inbound/outbound, threads, forms land here).

Branch `feat/supplier-sync`. Never merge to main without asking.

Production runs on Vercel:

- project `ecommerce-store` (`prj_PgrrXS1iNcDc1befNeZxALeyvUdb`), team `team_PWfGAvAztjBReus5OSj4J1gQ`, **Pro plan**
  (Hobby's image quota broke `/_next/image`);
- https://justpurrrfect.com.

To deploy, push the branch, then call the Vercel MCP `create_deployment` with `target: "production"` and `gitSource`
`{type: "github", org: "bojidaryovchev", repo: "ecommerce-store", ref: "feat/supplier-sync", sha}`. Each push also
queues a preview build, so production waits 2–4 minutes behind it. Database changes go to production with
`drizzle-kit migrate` against the production DATABASE_URL (13 migrations so far).

The roadmap lives in the plan doc (Claude Doc, id `8a855ea8-d559-4197-a129-e0e85dcb1506`):
https://claude.ai/artifact/J76m6ijGq5CXbqfaYttukq

## Standing rules from the user

- **Stripe stays in TEST mode** in production.
- **Nothing is indexed until the product descriptions are rewritten.** `SITE_INDEXING` is off, which sends an
  X-Robots-Tag noindex, a robots meta tag and no sitemap line. Turn it on only after the user approves the
  rewritten copy.
- **Images:** licensed images only (Unsplash/Pexels), credited in `docs/image-credits.md`, with no competitor
  logos.
- **Privacy:** never print secrets. The user's email is private, so `MAIL_TO` stays unset.
- **Reporting:** the user won't read long plans. Pick the next step, build it, and report briefly.
- **Package age:** pnpm has a 24-hour `minimumReleaseAge`. Pin versions older than a day; never add exclusions.

## Running it

- **Databases:** local Postgres is `postgres://postgres:devpass@localhost:55432/ecommerce`; tests use
  `ecommerce_test`.
- **Dev server** (in `apps/web`):
  `RESEND_API_KEY= DATABASE_URL=<local> AUTH_URL=http://localhost:3456 npx next dev --turbopack -p 3456`.
  The empty key stops tests from sending mail.
  - Restart dev after editing `messages/*.json`; Turbopack doesn't reload them.
  - If pages answer 500 with a JSON parse error, delete `apps/web/.next/dev` (its manifest got corrupted).
- **Production check:** run `npx next build` then `npx next start -p 3460`. Status codes (404/308 from
  `src/proxy.ts`), prerendering and crawler HTML only behave like production there or on Vercel.
- **Checks:**
  - `npx tsc --noEmit -p .` in apps/web;
  - mailbox tests: `MAILBOX_TEST_DATABASE_URL=<…/ecommerce_test> npx vitest run`;
  - supplier-sync tests: `SUPPLIER_SYNC_TEST_DATABASE_URL=<…/ecommerce_test> npx vitest run`;
  - commits run prettier and eslint through lint-staged.
- **Screenshots:** Playwright from the root `node_modules`, with scripts in your session scratchpad.

## What exists

| Area                                       | Where                                                                                                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header, mega menu, search suggestions      | `apps/web/src/components/common/navbar/*`                                                                                                                                                            |
| Home                                       | `src/app/[locale]/page.tsx`, `src/components/home/*` (hero, categories, house blueprint, seasonal picks, guides, FAQ, promo strip)                                                                   |
| Catalogue                                  | `src/app/[locale]/[...path]` (category pages: banner, filters on the left, spec chips), `/categories`, `/products`; catalogue 404/308 come from the proxy (`src/lib/route-index.ts`, `src/proxy.ts`) |
| Product page                               | `src/components/products/product-detail/*` (gallery with zoom, buy box, comparison bars, sticky phone bar, JSON-LD)                                                                                  |
| Installation, guides, calculators, contact | `/montazh/*` (GSAP SVG scroll stories, `src/content/installations.ts`), `/saveti` (`src/content/guides.ts`), `/kalkulatori` (`src/lib/calculators.ts`), `/kontakti` → mailbox                        |
| Information and legal                      | `src/content/legal.ts` (drafts, `LEGAL_DRAFT = true`), the withdrawal form at `/vrashtane/otkaz`                                                                                                     |
| Accounts                                   | Google plus email/password (`src/lib/auth.ts`, `src/mutations/auth/password-auth.mutation.ts`)                                                                                                       |
| Emails                                     | `src/emails/*`, Bulgarian or English by the order's locale                                                                                                                                           |
| Delivery, promotions                       | `src/lib/delivery.ts` (free unless `NEXT_PUBLIC_DELIVERY_FEE` / `_FREE_FROM` are set); promo codes with "Show in the shop"                                                                           |
| Supplier sync                              | full sync every 4 hours (`apps/web/vercel.json` crons)                                                                                                                                               |
| Catalogue enrichment                       | `packages/supplier-sync/src/enrich/*`, `.claude/skills/catalog-*`, `/admin/enrichment`, `docs/enrichment.md`: specs, categories, image kinds and copy on the Claude subscription                     |
| SEO                                        | `docs/seo-status.md` (the audit by the seo plugin, `d:\repos\claude-playbooks\plugins\seo`)                                                                                                          |

## Known problems

**Supplier data**

- Supplier specs contradict product names: "R32 Mono 5 kW" lists 17.6 kW.
- 15 MHP/SHPO heat pumps have no category.
- 77 product names are bare model codes.
- 19 descriptions carry the supplier's calls to action ("ПОИСКАЙТЕ ОФЕРТА…").
- `/produkt/italianski-peletni-kamini-artel` names the supplier's company.
- Supplier photos are hotlinked, and some are icons or badges.

**Catalogue and content**

- 20 subcategories have no description.
- Supplier sale prices can't be shown as reductions until we have 30 days of our own prices (the Omnibus rule).

**Routing**

- Unknown non-catalogue paths (`/saveti/x`) render the not-found page with noindex at status 200. This is a
  Cache Components limit; catalogue paths get real 404s from the proxy.

## Waiting on the user

- A lawyer reviews the legal drafts, and the company's name, UIC and address replace the placeholders.
- A brand name instead of "Ecommerce Store".
- Delivery terms.
- Registering `https://justpurrrfect.com/api/auth/callback/google` in Google Cloud. Then promote their account to
  admin (`user.role`).
