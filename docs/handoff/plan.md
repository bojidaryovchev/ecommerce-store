# Next work (asked for on 18 Nov)

Work in this order. Commit and deploy after each phase, and report to the user in a few lines.

## 1. Catalogue enrichment on the Claude subscription, not the API

**Goal:** every HydroTerm product goes through a pipeline that extracts structured data and rewrites the copy. It
runs on the user's Claude Code subscription, as buy-a-coffee does, so no API usage is billed.

**Study first.** These files in `d:\repos\lubo\buy-a-coffee` show how the subscription is connected (auth, how
Claude is invoked, where it runs). Reuse the same mechanism, and verify it rather than guess:

- `.github/workflows/copy.yml`
- `packages/scraper-core/src/catalog/copywriter/claude.ts` and `contract.ts`
- `apps/scraper/src/commands-catalog.ts`
- `packages/scraper-core/test/copywriter.test.ts`

Then replace the API call in `packages/supplier-sync/src/rewrite/`, keeping the API path as an option.

**Stages (gates).** Record each product's result per stage in a new table (for example `product_enrichment`:
stage, status, inputs hash, output, errors, timestamps), so runs resume and unchanged products are skipped.

1. **Extract.** From the supplier text and attributes, extract a typed schema per category:
   - heat pumps: heating and cooling kW, SCOP/COP, energy class, refrigerant, phase, noise dB, operating
     temperatures, hot-water tank;
   - air conditioners: BTU, SEER/SCOP, class, noise, area;
   - pellet stoves and boilers: kW, water-jacket kW, efficiency %, hopper kg, burn time, flue Ø;
   - radiators: W at ΔT50, dimensions, type 11/22/33;
   - towel rails: W, centre distance, finish.

   Store the values as numeric product attributes with units, so filters, comparison bars, spec chips and JSON-LD
   use them (energy class → `hasCertification`; GTIN/MPN if found).

2. **Validate.** Consistency gates:
   - the name against the specs (the 5 kW vs 17.6 kW case);
   - unit ranges per category;
   - required fields.

   Failures go to the admin review queue (the existing `sync_change` review UI) and are not published.

3. **Classify.** Assign a category where one is missing (the 15 heat pumps). Mark each image as a photo or an
   icon/badge.
4. **Rewrite.** Bulgarian copy built on the shop's section notes (`SECTION_NOTES` in `rewrite.ts`):
   - a name of the form type + brand + model, plus a meta description;
   - keep the 8-word copy gate (`checkCopy`);
   - ban supplier calls to action and supplier company names.
5. **Review and publish.** An admin page shows before and after for approval. Approved fields are locked, so the
   sync won't overwrite them.

**Triggers:** the sync, for new or changed products (the description hash changed), plus a backfill command.

**Benefits to state to the user:** no API cost; consistent specs behind filters, comparison and structured data;
original copy, which is the gate to indexing; data errors caught before shoppers see them.

**Done when:** a backfill over all ~387 products finishes with a report (counts per gate, failures listed) and the
user approves a sample. Then set `SITE_INDEXING=on`.

## 2. Photos or icons, slot by slot

- Audit every image slot: hero, category tiles, mega menu, product cards, product gallery, guides, installation
  pages, info pages, empty states, 404. Decide photo, illustration or icon for each, and apply it consistently.
- In product galleries, keep real photos only. Show supplier icons and badges (CE, A++, features) as small chips
  under the gallery, using the classification from stage 3.
- New pictures come from Unsplash or Pexels only, credited in `docs/image-credits.md`.

## 3. Responsive and visual quality at five widths

**Widths:** 360/390 (phone), 768 (tablet), 1024 (small laptop), 1440 (desktop), 1920+ (wide).

**Pages:** screenshot every page type at each width:

- home, a category, a product, search results, the cart sheet;
- checkout success, account pages, login and register;
- the installation hub and each story, the guide list and a guide, calculators;
- contact, information pages, the withdrawal form, 404;
- the main admin pages.

**What to fix:**

- spacing rhythm;
- empty areas that are too large (fill them with a picture, an illustration or a quiet animation only where it
  helps);
- maximum widths on wide screens;
- tap targets, type scale, and sticky elements overlapping.

**Motion:**

- GSAP through `src/lib/gsap.ts`, always respecting `REDUCED_MOTION_OK`.
- Optionally Three.js for one or two showpiece visuals, such as a 3D version of the house blueprint on the home
  page or the installation hub. Lazy-load it and give it a reduced-motion fallback; keep it off product and
  catalogue pages.
- Keep LCP and INP good, and don't overwhelm.

## 4. Features and flows

Walk every flow end to end and close the gaps:

- browse → filter → compare → product → cart → Stripe checkout (test) → success → emails → account orders →
  withdrawal or complaint;
- site-visit request → mailbox → reply;
- search suggestions; guides → calculator → products;
- login, register, reset; wishlist; reviews (verified buyers only);
- language switch; the mobile menu.

Candidates to propose to the user (ask before building the big ones):

- side-by-side product comparison;
- recently viewed;
- "tell me when it's back in stock";
- price ranges for installation per system;
- FAQ per category;
- an AI assistant on the subscription, handing over to the mailbox;
- cookie-free analytics.

The design-canvas plugin is only for a full redesign canvas, and that needs the user's visual direction. Otherwise
review from screenshots.
