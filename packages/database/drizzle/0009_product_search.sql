-- Fuzzy, script-insensitive product search: "kamina artel" finds "Камина Артел".
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
-- Bulgarian → Latin per the Transliteration Act (lowercase; the "-ия" ending rule is skipped for search).
CREATE OR REPLACE FUNCTION bg_translit(input text) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$
    SELECT translate(
      replace(replace(replace(replace(replace(replace(replace(lower(input),
        'щ', 'sht'), 'ж', 'zh'), 'ц', 'ts'), 'ч', 'ch'), 'ш', 'sh'), 'ю', 'yu'), 'я', 'ya'),
      'абвгдезийклмнопрстуфхъь',
      'abvgdeziyklmnoprstufhay'
    )
  $$;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "search_text" text GENERATED ALWAYS AS (lower("product"."name" || ' ' || coalesce("product"."brand", '')) || ' ' || bg_translit("product"."name" || ' ' || coalesce("product"."brand", ''))) STORED;--> statement-breakpoint
CREATE INDEX "product_search_text_trgm_idx" ON "product" USING gin ("search_text" gin_trgm_ops);
