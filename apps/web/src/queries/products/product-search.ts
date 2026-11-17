import { schema } from "@ecommerce/database";
import { and, ilike, or, sql, type SQL } from "drizzle-orm";

const MAX_WORDS = 6;

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (ch) => `\\${ch}`);

/** The words of a search query, lowercased; one-letter words are dropped unless they are digits. */
export function searchWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;]+/u)
    .filter((word) => word.length >= 2 || /^\d$/.test(word))
    .slice(0, MAX_WORDS);
}

// Bulgarian noun endings (plural, definite article), longest first: "камини", "камината" → "камин".
const BG_ENDINGS = ["ията", "ите", "ата", "ото", "ият", "ия", "ът", "ят", "та", "то", "те", "и", "а", "я", "о", "е"];
// The same endings typed in Latin letters ("kamini", "kotela").
const LATIN_ENDINGS = [
  "iyata",
  "iyat",
  "ite",
  "ata",
  "oto",
  "iya",
  "ia",
  "at",
  "yat",
  "ta",
  "to",
  "te",
  "i",
  "a",
  "ya",
  "o",
  "e",
];

/** A crude Bulgarian stem so singular and plural forms find each other ("лири" and "лира" → "лир"). */
export function stemWord(word: string): string {
  const cyrillic = /\p{Script=Cyrillic}/u.test(word);
  // Latin words are often English or model names; only stem longer ones.
  if (word.length < (cyrillic ? 4 : 5) || /\d/.test(word)) return word;
  for (const ending of cyrillic ? BG_ENDINGS : LATIN_ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 3) return word.slice(0, -ending.length);
  }
  return word;
}

/**
 * Every word must match the product's name or brand in either alphabet (product.search_text, which
 * also holds a Latin transliteration), its category's name, or its description — or closely
 * resemble a word in the name (typos). "kamina", "камини", "камна" and "артел" all find what you'd expect.
 */
export function productSearchCondition(query: string): SQL | undefined {
  const words = searchWords(query);
  if (words.length === 0) return undefined;
  return and(
    ...words.map((word) => {
      const pattern = `%${escapeLike(stemWord(word))}%`;
      return or(
        sql`${schema.products.searchText} LIKE ${pattern}`,
        // A Cyrillic query against a Latin name: "артел" → "artel".
        sql`${schema.products.searchText} LIKE bg_translit(${pattern})`,
        sql`word_similarity(${word}, ${schema.products.searchText}) > 0.5`,
        // A category matching the word, or any category below it ("котли" → boilers in its subcategories).
        sql`${schema.products.categoryId} IN (
          WITH RECURSIVE matched AS (
            SELECT c.id FROM ${schema.categories} c
            WHERE lower(c.name) LIKE ${pattern} OR bg_translit(c.name) LIKE bg_translit(${pattern})
            UNION
            SELECT child.id FROM ${schema.categories} child JOIN matched ON child.parent_id = matched.id
          )
          SELECT id FROM matched
        )`,
        ilike(sql`COALESCE(${schema.products.description}, '')`, pattern),
      )!;
    }),
  );
}

/** How well a product's name matches the query (higher is better), for ordering results. */
export function productSearchRank(query: string): SQL {
  return sql`word_similarity(${searchWords(query).join(" ")}, ${schema.products.searchText})`;
}
