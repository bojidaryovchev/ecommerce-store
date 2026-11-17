/**
 * The supplier has no brand field; brands appear only inside product names, in Latin or
 * Cyrillic spelling. Each entry maps the spellings we have seen to one display name.
 * Admins can correct a product's brand by hand (the field then locks).
 */
export const KNOWN_BRANDS: ReadonlyArray<{ name: string; aliases: readonly string[] }> = [
  { name: "Artel", aliases: ["artel", "артел"] },
  { name: "Ocean", aliases: ["ocean", "оушън"] },
  {
    name: "Hydro Term",
    aliases: ["hydro term", "hydroterm", "hydro therm", "hydrotherm", "хидро терм", "хидротерм"],
  },
  { name: "Guardian", aliases: ["guardian"] },
  { name: "Riffle", aliases: ["riffle"] },
  { name: "Unidelta", aliases: ["unidelta"] },
  { name: "Pellmax", aliases: ["pellmax", "пелмакс"] },
  { name: "Sira", aliases: ["sira"] },
  { name: "Epseco", aliases: ["epseco"] },
  { name: "ThermArt", aliases: ["thermart"] },
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PATTERNS = KNOWN_BRANDS.flatMap((brand) =>
  brand.aliases.map((alias) => ({
    name: brand.name,
    pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(alias).replace(/ /g, "\\s+")}(?![\\p{L}\\p{N}])`, "iu"),
  })),
);

/** Returns the brand named earliest in the text, or null. Expects mixed scripts already fixed. */
export function detectBrand(text: string): string | null {
  let best: { name: string; index: number } | null = null;
  for (const { name, pattern } of PATTERNS) {
    const match = pattern.exec(text);
    if (match && (best === null || match.index < best.index)) {
      best = { name, index: match.index };
    }
  }
  return best?.name ?? null;
}
