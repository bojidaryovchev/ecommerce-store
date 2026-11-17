/**
 * Text clean-up for supplier data: HTML entities, HTML → plain text, and words that mix
 * Cyrillic and Latin look-alike letters ("Аrtel" typed with a Cyrillic А).
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  bdquo: "„",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  euro: "€",
  deg: "°",
  sup2: "²",
  sup3: "³",
  times: "×",
  plusmn: "±",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  middot: "·",
  bull: "•",
  copy: "©",
  reg: "®",
  trade: "™",
  micro: "µ",
  shy: "",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (match, code: string) => {
    if (code.startsWith("#")) {
      const isHex = code[1] === "x" || code[1] === "X";
      const n = isHex ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      if (!Number.isFinite(n) || n <= 0 || n > 0x10ffff) return match;
      return n === 0xa0 ? " " : String.fromCodePoint(n);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Collapses runs of whitespace (including no-break spaces) to one space and trims. */
export function collapseWhitespace(text: string): string {
  return text.replace(/[\s\u00a0\u2000-\u200b\u202f\u205f\u3000]+/g, " ").trim();
}

const BLOCK_TAGS = "p|div|h[1-6]|ul|ol|table|thead|tbody|tr|section|article|blockquote|header|footer";

/**
 * Converts supplier HTML to plain text with line breaks: blocks become lines, list items
 * become "• " lines, table rows become "cell: cell" lines. Scripts, styles and comments
 * are dropped. The result is safe to render as text.
 */
export function htmlToText(html: string): string {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n• ");
  s = s.replace(/<\/li>/gi, "");
  s = s.replace(new RegExp(`</(?:${BLOCK_TAGS})>`, "gi"), "\n");
  s = s.replace(new RegExp(`<(?:${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n");
  s = s.replace(/<\/t[dh]>/gi, "\t");
  s = s.replace(/<[^>]*>/g, "");
  s = decodeEntities(s);

  const lines: string[] = [];
  for (const rawLine of s.split("\n")) {
    const cells = rawLine
      .split("\t")
      .map((cell) => collapseWhitespace(cell))
      .filter(Boolean);
    const line = cells.length === 2 ? `${cells[0]}: ${cells[1]}` : cells.join(" | ");
    if (line === "" && (lines.length === 0 || lines[lines.length - 1] === "")) continue;
    if (line === "•") continue;
    lines.push(line);
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

// Look-alike letters, in both directions.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: "A",
  В: "B",
  Е: "E",
  К: "K",
  М: "M",
  Н: "H",
  О: "O",
  Р: "P",
  С: "C",
  Т: "T",
  Х: "X",
  У: "Y",
  а: "a",
  е: "e",
  к: "k",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
};
const LATIN_TO_CYRILLIC: Record<string, string> = Object.fromEntries(
  Object.entries(CYRILLIC_TO_LATIN).map(([cyr, lat]) => [lat, cyr]),
);

const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /\p{Script=Latin}/u;

/**
 * Fixes words that mix Cyrillic and Latin letters. A word is converted to the script whose
 * letters cannot all be swapped for look-alikes ("Аrtel" → "Artel", "Eнергиен" → "Енергиен",
 * "кW" → "kW"). When both directions are possible, the majority script wins (Cyrillic on a tie).
 */
export function fixMixedScripts(text: string): string {
  return text.replace(/[\p{L}\p{M}]+/gu, (word) => {
    const letters = [...word];
    const cyr = letters.filter((ch) => CYRILLIC.test(ch));
    const lat = letters.filter((ch) => LATIN.test(ch));
    if (cyr.length === 0 || lat.length === 0) return word;

    const cyrConvertible = cyr.every((ch) => ch in CYRILLIC_TO_LATIN);
    const latConvertible = lat.every((ch) => ch in LATIN_TO_CYRILLIC);

    let target: "latin" | "cyrillic" | null = null;
    if (cyrConvertible && !latConvertible) target = "latin";
    else if (latConvertible && !cyrConvertible) target = "cyrillic";
    else if (cyrConvertible && latConvertible) target = lat.length > cyr.length ? "latin" : "cyrillic";
    if (!target) return word;

    const map = target === "latin" ? CYRILLIC_TO_LATIN : LATIN_TO_CYRILLIC;
    return letters.map((ch) => map[ch] ?? ch).join("");
  });
}

/** Clean-up for short single-line strings such as product, category and attribute names. */
export function cleanLabel(text: string): string {
  return fixMixedScripts(collapseWhitespace(decodeEntities(text.replace(/<[^>]*>/g, " "))));
}

export function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}
