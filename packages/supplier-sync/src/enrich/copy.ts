import type { CopyAnswer, CopyItem } from "./contract";
import { SPEC_FIELDS, type ProductKind } from "./fields";
import { checkKeywordUse, type KeywordTarget } from "./keywords";
import type { ValidatedSpec } from "./validate";

/**
 * The rewrite stage's inputs and its gate.
 *
 * The copy is built only on facts that passed validation: a figure in doubt is listed in `omit` and must not
 * appear. The gate then refuses copy that lifts the supplier's wording, carries their calls to action or
 * company name, states prices or contact details, names the product without its brand and model, or leaves out
 * (or stuffs) the phrase people search for (keywords.ts).
 */

/**
 * What the shop itself knows about each section of the catalogue, from its guides, calculators and
 * installation pages: what makes a description more than the supplier's text reworded.
 */
export const SECTION_NOTES: Record<string, string> = {
  termopompi:
    'Sizing: by the home\'s heat loss, roughly 35 W/m² for a new well-insulated house, 60 W/m² for an insulated older one, 100 W/m² without insulation, about 20% more in the mountains, plus about 0.25 kW per person for hot water. Installing: an outdoor unit on a wall bracket or stand with free airflow, connected to radiators or underfloor heating; monoblock units carry the hydraulics outside, split units have an indoor hydraulic module; a separate electrical supply. Guides: "Каква термопомпа ми трябва?" and the heat pump power calculator.',
  klimatitsi:
    'Sizing: about 100 W/m² at a 2.6 m ceiling, more for sunny rooms, top floors and kitchens; 9,000 BTU suits roughly 20–25 m², 12,000 BTU 25–35 m². Installing: indoor and outdoor unit, the refrigerant line between them, a condensate drain and its own electrical line; inverter units heat efficiently too. Guides: "Колко BTU климатик ми трябва?" and the air conditioner calculator.',
  "peletni-kamini":
    'Choosing: a dry stove heats the room it stands in; a stove with a water jacket also feeds the radiators; a boiler sits in a utility room. Installing: a chimney of the right section and draught, or an insulated steel flue; for water jackets an expansion vessel, a pump and safety devices. Guide: "Пелетна камина или пелетен котел?".',
  kotli:
    'Choosing: a boiler heats the whole house through the radiators from a utility room; pellet boilers feed automatically from a hopper. Installing: a chimney of the right section and draught, connection to the heating circuit with pump, expansion vessel and safety devices. Guide: "Пелетна камина или пелетен котел?".',
  "radiatori-i-konvektori":
    'Sizing: a room needs roughly 60 W/m² when well insulated, 80 average, 100 poor; with low-temperature water (heat pumps) a radiator gives about half its catalogue output, so it must be larger. Guide: "Как да изберем радиатор" and the radiator calculator.',
  "liri-za-banya":
    "Choosing: by the heat the bathroom needs and the centre distance of the pipes; electric versions need no connection to the heating.",
  "podovo-otoplenie":
    'Underfloor heating works with low water temperatures, which suits heat pumps; it needs a manifold, pipe loops and insulation under the screed, laid before the floor is finished. Guide: "Подово отопление: как работи и кога си струва".',
  "solarni-sistemi":
    "Solar water heaters take a large part of the hot water in summer; they need a sunny roof or wall facing south.",
  "pompi-i-trabi":
    "Pumps and pipes for building and maintaining heating systems; a circulation pump is sized by the system's flow and head.",
  "industrialno-otoplenie": "Heating for workshops, warehouses and large rooms, sized by volume and heat loss on site.",
};

export interface CopyContext {
  id: string;
  currentName: string;
  brand: string | null;
  model: string | null;
  kind: ProductKind;
  category: string | null;
  sectionSlug: string | null;
  specs: ValidatedSpec[];
  omit: readonly string[];
  features: string[];
  supplierDescription: string | null;
  siblings: string[];
  keywords: KeywordTarget | null;
  retry: string[] | null;
  previous?: CopyItem["previous"];
}

export function buildCopyItem(context: CopyContext): CopyItem {
  const omitted = new Set(context.omit);
  return {
    id: context.id,
    currentName: context.currentName,
    brand: context.brand,
    model: context.model,
    kind: context.kind,
    category: context.category,
    sectionNotes: (context.sectionSlug && SECTION_NOTES[context.sectionSlug]) || null,
    specs: context.specs
      .filter((spec) => !omitted.has(spec.key))
      .map((spec) => ({
        name: SPEC_FIELDS[spec.key].name,
        value: spec.condition ? `${spec.text} (${spec.condition})` : spec.text,
      })),
    features: context.features,
    omit: context.omit.map((key) => (key in SPEC_FIELDS ? SPEC_FIELDS[key as keyof typeof SPEC_FIELDS].name : key)),
    supplierDescription: context.supplierDescription,
    siblings: context.siblings.slice(0, 12),
    keywords: context.keywords,
    retry: context.retry,
    previous: context.previous ?? null,
  };
}

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

/** The first run of eight words the copy shares with the source, if any. Seven in a row are a coincidence. */
export function copiedRun(copy: string, source: string | null, length = 8): string | null {
  if (!source) return null;
  const sourceWords = words(source);
  const shingles = new Set<string>();
  for (let i = 0; i + length <= sourceWords.length; i++) shingles.add(sourceWords.slice(i, i + length).join(" "));
  const written = words(copy);
  for (let i = 0; i + length <= written.length; i++) {
    const run = written.slice(i, i + length).join(" ");
    if (shingles.has(run)) return run;
  }
  return null;
}

/** The supplier's calls to action, company and contact details: never in our copy. */
const BANNED: Array<[RegExp, string]> = [
  [/поискайте\s+(?:ни\s+)?оферта/iu, "a call to ask for an offer (the supplier's)"],
  [/получете\s+оферта/iu, "a call to ask for an offer (the supplier's)"],
  [/попълн(?:ете|ите|и)\s/iu, "an instruction to fill in a form"],
  [/полетата\s+по-долу/iu, "a reference to the supplier's form"],
  [/ще\s+се\s+свържем\s+с\s+вас/iu, "the supplier's promise to call back"],
  // "Hydro Term" is also the brand of the supplier's own boilers, and a brand belongs in the name; the company
  // as a seller, importer or contact does not.
  [
    /(?:хидро\s*-?\s*терм|hydro\s*-?\s*therm?)\s*(?:е?еоод|оод|ад|ltd|eood|ood)|hydrotermbg|(?:фирма|дружеството|вносител\p{L}*|дистрибутор\p{L}*)\s+(?:„|")?(?:хидро|hydro)/iu,
    "the supplier's company",
  ],
  [/hydrotherm|хидротерм/iu, 'the brand spelled other than "Hydro Term"'],
  [/https?:\/\/|www\.|\b[\w-]+\.(?:bg|com|eu|net|org)\b/iu, "a web address"],
  [/[\w.+-]+@[\w-]+\.[\w.]+/u, "an email address"],
  [/(?:\+359|\b0)[\s-]?[2-9]\d{1,2}[\s-]?\d{2,3}[\s-]?\d{2,4}\b/u, "a phone number"],
  [/€|\d\s*(?:лв|евро|eur\b|bgn\b)|\bцена(?:та)?\s+(?:е|от)\s+\d/iu, "a price"],
  [/!/u, "an exclamation mark"],
  [/(?:^|\n)\s*#|\*\*|__|`/u, "Markdown"],
  [/\p{Extended_Pictographic}/u, "an emoji"],
  [/най-добр|номер\s*1\b|№\s*1\b/iu, "an unprovable superlative"],
  // Warranty terms are the shop's legal matter (its warranty page), not something product copy promises.
  [/гаранци/iu, "a warranty statement"],
];

/** Lowercase, decimal commas as points, without spaces, dashes or slashes: "17,6 kW" and "17.6kw" match. */
const squash = (text: string) =>
  text
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/[\s\-–—_/]+/g, "");

/** Latin letters that look like Cyrillic, for comparing model codes written in either script. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  в: "b",
  е: "e",
  к: "k",
  м: "m",
  н: "h",
  о: "o",
  р: "p",
  с: "c",
  т: "t",
  у: "y",
  х: "x",
};
const latinish = (text: string) =>
  squash(text)
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");

/** The parts of a model designation a name must keep: every token with a digit in it ("MHP", "5RP24" → "5RP24"). */
export function modelTokens(model: string | null, currentName: string): string[] {
  const from = model ?? currentName;
  return [...new Set(from.split(/[\s,()–—/]+/).filter((token) => /\d/.test(token) && token.length >= 2))].slice(0, 4);
}

export interface CopyGateInput {
  item: CopyItem;
  /** Texts of figures the copy must not state (contested values, in every spelling). */
  forbiddenFigures: string[];
}

/** Why a rewrite is unusable; empty when it passes. */
export function checkCopyAnswer(answer: CopyAnswer, input: CopyGateInput): string[] {
  const { item } = input;
  const problems: string[] = [];
  const name = answer.name.trim();
  const description = answer.description.trim();
  const meta = answer.metaDescription.trim();
  const minimum = item.kind === "accessory" || item.kind === "other" ? 120 : 200;

  if (description.length < minimum)
    problems.push(`the description is too short (${description.length} characters; at least ${minimum})`);
  if (meta.length < 70 || meta.length > 170)
    problems.push(`the meta description is ${meta.length} characters (70–170)`);
  if (/\n/.test(meta)) problems.push("the meta description has a line break");
  if (name.length < 6 || name.length > 110) problems.push(`the name is ${name.length} characters (6–110)`);
  const letters = name.match(/\p{L}/gu) ?? [];
  const capitals = name.match(/\p{Lu}/gu) ?? [];
  if (letters.length > 8 && capitals.length / letters.length > 0.5) problems.push("the name is in capitals");
  if (item.brand && !latinish(name).includes(latinish(item.brand)))
    problems.push(`the name leaves out the brand ${item.brand}`);
  for (const token of modelTokens(item.model, item.currentName)) {
    if (!latinish(name).includes(latinish(token))) problems.push(`the name leaves out “${token}” from the model`);
  }

  const run = copiedRun(description, item.supplierDescription) ?? copiedRun(meta, item.supplierDescription);
  if (run) problems.push(`it copies an 8-word run from the supplier text (“${run}”)`);

  for (const [text, label] of [
    [name, "name"],
    [meta, "meta description"],
    [description, "description"],
  ] as const) {
    for (const [pattern, what] of BANNED) {
      if (pattern.test(text)) problems.push(`the ${label} contains ${what}`);
    }
  }

  const all = squash(`${name} ${meta} ${description}`);
  for (const figure of input.forbiddenFigures) {
    const needle = squash(figure);
    if (needle.length >= 3 && all.includes(needle)) problems.push(`it states ${figure}, which is in doubt`);
  }
  if (item.keywords) problems.push(...checkKeywordUse({ name, metaDescription: meta, description }, item.keywords));
  return [...new Set(problems)];
}

/** "17.6 kW" → ["17.6 kW", "17,6 kW", "17.6kw"]: the spellings a figure may take in copy. */
export function figureSpellings(text: string): string[] {
  const trimmed = text.trim();
  return [...new Set([trimmed, trimmed.replace(".", ","), trimmed.replace(",", ".")])];
}
