# Catalogue enrichment

The supplier's data (hydrotermbg.com) is copied text with unreliable figures: specification fields contradict
product names (a "5 kW" heat pump listed at 17.6 kW), the real figures often sit only in pictures of tables,
and feature icons are mixed in with the product photos. The enrichment pipeline turns each product into the
shop's own data and copy, with evidence, and nothing of it is published until an admin approves.

Code: `packages/supplier-sync/src/enrich/`. Skills: `.claude/skills/catalog-research` and `catalog-copy`.
Admin: `/admin/enrichment`.

## The gates

Every product's result is recorded per stage in `product_enrichment` (stage, status, inputs hash, output,
errors, attempts, timestamps). A stage whose inputs are unchanged is skipped, so a run resumes where the last
one stopped, and the daily run only touches products the supplier changed.

1. **Extract** (model). A headless Claude Code session reads the supplier's text, attribute fields and
   images (it opens spec tables and energy labels), searches the web for the exact model (manufacturer's
   datasheets first, EPREL for energy classes; never the supplier's or our own site) and returns typed
   specifications for the product's kind (`fields.ts`: heat pumps, air conditioners, pellet stoves, boilers,
   radiators, towel rails, fan coils, pumps), each with its source, test condition and confidence. Products
   sharing the supplier's text are researched together, from one datasheet. Radiators and towel rails are
   researched too: the supplier rarely states their output, and the output table must name the exact size.
   Parts (kits, brackets, ...) are only read from the supplier's data. A part the research recognises in a
   unit's category, such as a bracket among the radiators, is checked as a part, not as a radiator without an
   output.
2. **Validate** (code, `validate.ts`). Types and plausible ranges per kind; figures in the name against the
   specs; the supplier's attribute fields against what was found (a contradiction the name settles is
   corrected, any other goes to review); required fields; GTIN check digits. Radiator and towel-rail outputs
   are brought to ΔT50 (EN 442, n = 1.3). Problems put the product in the supplier sync's review queue
   (`enrichment_flagged`). Notices (the EU F-gas rule for R32 monoblocks up to 12 kW, area claims) are shown
   to the admin only.
3. **Classify** (model, same session). A category for products without one, and what each image is (photo,
   icon, badge, energy label, spec table, diagram, logo), shared per image URL in `image_asset`, plus whether
   a photo shows another model or size than the product.
4. **Rewrite** (model). The name (kind + brand + model), the description and the meta description in
   Bulgarian, built on validated facts and the shop's section notes (`SECTION_NOTES` in `copy.ts`: sizing,
   installing, guides). The gate (`checkCopyAnswer`) refuses copy with an 8-word run from the supplier's text,
   their calls to action, name or contacts, prices, warranty claims, Markdown or exclamation marks, a name
   without the brand and model, or any figure in doubt. A refused text is retried with the reasons.
5. **Publish** (admin). The review page shows before and after; the admin can correct the copy and the
   values, choose which parts to publish (copy, specifications, category) or reject. Published fields are
   locked (`name`, `description`, `attributes`, `categoryId`), so the sync stops overwriting them and reports
   the supplier's later changes in the review queue. "Approve all ready" publishes every proposal that passed
   every gate.

Published specifications are attribute values with source `enrichment`; they replace the supplier's values
of the same figure, and supplier attributes the research did not cover stay. Filters, the comparison bars,
the spec chips and the structured data read them like any attribute. GTIN and MPN go to `product.metadata`.

## Running it

It runs on the Claude subscription, like buy-a-coffee's catalogue copywriter: `claude -p` with the machine's
own sign-in, or `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` on CI. The model's process gets an
allow-listed environment (no database URL), an empty workspace with only the skill, the batch file and its
images, and only Read (plus WebSearch and WebFetch for research). `--engine api` runs the same sessions on
`ANTHROPIC_API_KEY` instead.

```bash
cd packages/supplier-sync
pnpm enrich                                 # plan only: what a run would do
pnpm enrich --apply                         # up to 40 products
pnpm enrich --apply --limit 1000 --concurrency 3   # a backfill
pnpm enrich --apply --slug a,b --force      # redo two products
pnpm enrich --report                        # counts per gate, flagged and failed products
pnpm enrich --rerun a,b                     # have the next run redo these
```

Needs `DATABASE_URL`. Downloaded images are cached in `~/.cache/ecommerce-enrich/images`
(`ENRICH_IMAGE_CACHE`). Models: `ENRICH_RESEARCH_MODEL`, `ENRICH_COPY_MODEL` (default `claude-opus-5-5`).
Exit codes: 0 done, 1 the CLI could not start or sign in, 2 stopped early (usage limit) or some sessions
failed; the next run picks up where it stopped.

The GitHub workflow `.github/workflows/enrich.yml` runs it daily after the supplier sync, for new and changed
products, once the secrets `DATABASE_URL` and `CLAUDE_CODE_OAUTH_TOKEN` are set.

## Changing the rules

- A new field or kind: `fields.ts` (and its range). The attribute is created on the first publish.
- Different instructions: the skills. To redo every product under new rules, bump the stage's version in
  `STAGE_VERSIONS` (`state.ts`).
- Stricter or looser checks: `validate.ts` (data) and `copy.ts` (copy). Re-validation needs no model: a
  bumped `validate` version is applied to stored research on the next run.
