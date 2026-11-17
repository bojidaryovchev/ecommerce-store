/**
 * Bulgarian → Latin transliteration as defined by the Bulgarian Transliteration Act (2009),
 * used for URL slugs: "Пелетни камини" → "peletni-kamini", "България" → "bulgaria".
 */

const MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sht",
  ъ: "a",
  ь: "y",
  ю: "yu",
  я: "ya",
  ѝ: "i",
  // Russian/Ukrainian letters that occasionally show up in product names.
  ё: "yo",
  ы: "y",
  э: "e",
  є: "ye",
  і: "i",
  ї: "yi",
};

/** Transliterates Cyrillic letters; everything else is kept. Output keeps the input's case. */
export function transliterateBg(text: string): string {
  // The Act's exception: the country's name is always "Bulgaria".
  const withExceptions = text.replace(/(?<!\p{L})българия(?!\p{L})/giu, (word) =>
    word === word.toUpperCase() ? "BULGARIA" : word.startsWith("Б") ? "Bulgaria" : "bulgaria",
  );
  // The Act's one contextual rule: "ия" at the end of a word becomes "ia".
  const withEndings = withExceptions.replace(/ия(?=$|[^\p{L}])/gu, "ia").replace(/ИЯ(?=$|[^\p{L}])/gu, "IA");
  let out = "";
  for (const ch of withEndings) {
    const lower = ch.toLowerCase();
    const mapped = MAP[lower];
    if (mapped === undefined) {
      out += ch;
    } else if (ch === lower) {
      out += mapped;
    } else {
      out += mapped.charAt(0).toUpperCase() + mapped.slice(1);
    }
  }
  return out;
}

/** URL slug in lowercase ASCII: transliterated, accents removed, words joined by "-". */
export function slugify(text: string, maxLength = 80): string {
  const ascii = transliterateBg(text)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (ascii.length <= maxLength) return ascii;
  const cut = ascii.slice(0, maxLength);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > maxLength / 2 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, "");
}
