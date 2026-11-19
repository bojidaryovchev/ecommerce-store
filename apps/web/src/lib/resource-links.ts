import { guideHref } from "@/content/guides";
import { installationHref } from "@/lib/installation-systems";

/**
 * The shop's own guides, calculators and installation pages as the copy names them. The product descriptions
 * and the category questions name them in words (their writers are not allowed links), so the page links the
 * names: the buyer gets there in one click, and the pages link to each other.
 */
const RESOURCES: ReadonlyArray<{ href: string; pattern: RegExp }> = [
  // The guide's title, and the shorter name older copy used for it.
  { href: guideHref("kakva-termopompa-mi-tryabva"), pattern: /Каква термопомпа (?:въздух-вода )?ми трябва\?/u },
  { href: guideHref("kolko-btu-klimatik"), pattern: /Колко BTU климатик ми трябва\?/u },
  { href: guideHref("peletna-kamina-ili-kotel"), pattern: /Пелетна камина или пелетен котел\?/u },
  { href: guideHref("podovo-otoplenie"), pattern: /Подово отопление: как работи и кога си струва/u },
  { href: guideHref("kak-da-izberem-radiator"), pattern: /Как да изберем радиатор/u },
  { href: "/kalkulatori/termopompa", pattern: /калкулатор\p{L}* за мощност(?:та)? на термопомп\p{L}*/iu },
  { href: "/kalkulatori/klimatik", pattern: /калкулатор\p{L}* за (?:мощност(?:та)? на )?климатик\p{L}*/iu },
  { href: "/kalkulatori/radiatori", pattern: /калкулатор\p{L}* за радиатор\p{L}*/iu },
  { href: installationHref("termopompa"), pattern: /Монтаж на термопомпа въздух-вода/u },
  { href: installationHref("klimatik"), pattern: /Монтаж на климатик/u },
  { href: installationHref("peletno-otoplenie"), pattern: /Монтаж на пелетно отопление/u },
  { href: installationHref("podovo-otoplenie"), pattern: /Монтаж на подово отопление/u },
];

export type TextSegment = string | { text: string; href: string };

/** The text split at the first mention of each resource, the mentions carrying their links. */
export function resourceSegments(text: string): TextSegment[] {
  const found = RESOURCES.flatMap(({ href, pattern }) => {
    const match = pattern.exec(text);
    return match ? [{ start: match.index, end: match.index + match[0].length, href }] : [];
  }).sort((a, b) => a.start - b.start);
  const segments: TextSegment[] = [];
  let at = 0;
  for (const link of found) {
    if (link.start < at) continue; // overlaps the one before
    if (link.start > at) segments.push(text.slice(at, link.start));
    segments.push({ text: text.slice(link.start, link.end), href: link.href });
    at = link.end;
  }
  if (at < text.length) segments.push(text.slice(at));
  return segments;
}
