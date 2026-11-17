ALTER TABLE "product" ADD COLUMN "slug" text;--> statement-breakpoint
-- Backfill: transliterated name ("Пелетна камина ARTEL" → "peletna-kamina-artel"), max 80 chars;
-- duplicates get -2, -3… in creation order. New products get their slug from the app.
UPDATE "product" SET "slug" = trim(BOTH '-' FROM left(regexp_replace(bg_translit("name"), '[^a-z0-9]+', '-', 'g'), 80));--> statement-breakpoint
UPDATE "product" SET "slug" = 'product-' || left("id", 8) WHERE "slug" IS NULL OR "slug" = '';--> statement-breakpoint
WITH ranked AS (
  SELECT "id", "slug", row_number() OVER (PARTITION BY "slug" ORDER BY "created_at", "id") AS n FROM "product"
)
UPDATE "product" p SET "slug" = ranked."slug" || '-' || ranked.n FROM ranked WHERE p."id" = ranked."id" AND ranked.n > 1;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_slug_unique" UNIQUE("slug");
