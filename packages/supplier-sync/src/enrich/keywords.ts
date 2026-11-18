/**
 * The search phrases a product page is written around: the phrases people in Bulgaria actually search for that truly
 * describe the product (search-demand.ts), chosen by its kind, subtype and size.
 *
 * Demand sits at the type level ("електрическа лира за баня", 1,600 a month; "котел на пелети", 880), rarely at the
 * model code. So each product leads with the most searched phrase for its own subtype, and the one-word head terms
 * ("климатик", "термопомпа") stay with the category pages instead of competing on every product.
 */
import type { ProductKind, SpecKey } from "./fields";
import { SEARCH_DEMAND } from "./search-demand";

export interface KeywordTarget {
  /** The most searched phrase that fits: the name, the meta description and the opening paragraph use it. */
  primary: string;
  /** Its monthly searches in Bulgaria, for the admin. */
  volume: number;
  /** Other fitting phrases with demand, for where they read naturally. */
  secondary: string[];
}

export interface KeywordInput {
  kind: ProductKind;
  categorySlug: string | null;
  /** The supplier's name and our category's name: the words that tell the subtype ("с водна риза", "електрическа"). */
  text: string;
  /**
   * The supplier's description, read only for parts, whose names are often bare ("Филтър за Minicen"). A unit's
   * description can mention other subtypes ("unlike stoves with a water jacket"), so its name decides.
   */
  description?: string | null;
  specs: ReadonlyArray<{ key: SpecKey; value: number | string | boolean }>;
}

/** Below this a phrase's volume is noise. */
export const MIN_SEARCH_VOLUME = 10;

/** Lower case, hyphens and slashes as spaces, single spaces: how the demand table spells phrases. */
export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-–—/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchVolume(phrase: string): number {
  return SEARCH_DEMAND[normalizePhrase(phrase)] ?? 0;
}

/**
 * The phrases that describe the product. `lead` names its subtype and can open a product name ("Котел на пелети
 * Artel…"); `support` fits it too but reads better in the text ("печка на пелети без водна риза", sizes, colours).
 */
export function candidatePhrases(input: KeywordInput): { lead: string[]; support: string[] } {
  const text = normalizePhrase(`${input.text} ${input.categorySlug ?? ""}`);
  const has = (pattern: RegExp) => pattern.test(text);
  const spec = (key: SpecKey) => input.specs.find((s) => s.key === key)?.value;
  const num = (key: SpecKey) => {
    const value = spec(key);
    return typeof value === "number" ? value : null;
  };
  const kw = num("heatingKw");
  const n = kw !== null ? Math.round(kw) : null;
  const lead: string[] = [];
  const support: string[] = [];

  switch (input.kind) {
    case "heat_pump": {
      if (has(/въздух въздух/)) lead.push("термопомпа въздух въздух");
      else if (has(/вода вода/)) lead.push("термопомпа вода вода");
      else lead.push("термопомпа въздух вода");
      if (has(/моноблок|monoblok/)) support.push("термопомпа моноблок");
      if (has(/сплит|split/)) support.push("термопомпа сплит");
      support.push("термопомпа за отопление");
      if (n) support.push(`термопомпа ${n} kw`, `термопомпа въздух вода ${n} kw`);
      break;
    }
    case "air_conditioner": {
      const btu = num("coolingBtu");
      if (has(/без външно тяло/)) lead.push("климатик без външно тяло");
      if (has(/подов|колон|конзол|podov/)) {
        lead.push("подов климатик");
        if (has(/колон/)) lead.push("колонен климатик");
        if (btu) support.push(`подов климатик ${btu} btu`);
      }
      if (has(/инвертор/)) lead.push("инверторен климатик");
      if (btu) support.push(`климатик ${btu} btu`, `инверторен климатик ${btu} btu`);
      break;
    }
    case "pellet_stove": {
      if (has(/водна риза|vodna riza/) && !has(/без водна риза/)) {
        lead.push("пелетна камина с водна риза", "камина на пелети с водна риза");
        support.push("печка на пелети с водна риза");
        if (has(/вграждане|vgrazhdane/)) support.push("пелетна камина за вграждане", "камина на пелети за вграждане");
        if (n) support.push(`камина на пелети с водна риза ${n} kw`, `пелетна камина с водна риза ${n} kw`);
      } else if (has(/вграждане|vgrazhdane/)) {
        lead.push("пелетна камина за вграждане", "камина на пелети за вграждане");
      } else {
        lead.push("суха пелетна камина");
        support.push(
          "печка на пелети без водна риза",
          "камина на пелети без водна риза",
          "пелетна камина без водна риза",
        );
        if (n) support.push(`пелетна камина ${n} kw`, `печка на пелети ${n} kw`);
      }
      support.push("печка на пелети", "камина на пелети", "пелетна камина");
      break;
    }
    case "boiler": {
      if (has(/газ|gaz/)) lead.push("газов котел", "котел на газ");
      else if (has(/нафта/)) lead.push("котел на нафта");
      else if (has(/пелет|peleten|peletni/)) {
        lead.push("котел на пелети", "пелетен котел");
        support.push("пелетни котли");
        if (n) support.push(`пелетен котел ${n} kw`, `котел на пелети ${n} kw`);
      } else {
        lead.push("котел на твърдо гориво");
        if (has(/чугун/)) lead.push("чугунен котел");
      }
      break;
    }
    case "radiator": {
      if (has(/панел|panel/)) {
        const type = spec("panelType");
        lead.push("панелен радиатор");
        if (type) lead.push(`панелен радиатор тип ${type}`);
        support.push("радиатор за отопление");
        if (type) support.push(`радиатор тип ${type}`);
      } else {
        lead.push("алуминиев радиатор");
        support.push("алуминиеви радиатори", "радиатор за отопление");
        if (has(/глидер|glider/)) support.push("алуминиеви глидери");
        const height = num("heightMm");
        if (height) support.push(`алуминиев радиатор h${height}`);
      }
      break;
    }
    case "towel_rail": {
      const heating = spec("heatingType");
      const electric = heating === "Електрическа" || has(/електрическ|elektricheska|elektricheski/);
      if (electric) lead.push("електрическа лира за баня");
      // Only when the data says so: a rail rated in watts may be electric although its name does not say it.
      else if (heating === "Водна") support.push("водна лира за баня");
      if (has(/алуминиев|aluminiev/)) lead.push("алуминиева лира за баня");
      if (has(/стоманен|stomanen/)) lead.push("стоманена лира за баня");
      if (has(/дизайнер|dizaynersk/)) lead.push("дизайнерска лира за баня");
      // The category's term: it leads only when nothing more specific fits, and the subtype phrases contain it.
      support.push("лира за баня");
      const height = num("heightMm");
      if (height !== null && height <= 700) support.push("малка лира за баня");
      if (has(/черен|черна|cheren/))
        support.push("черна лира за баня", electric ? "черна електрическа лира за баня" : "");
      break;
    }
    case "fan_coil": {
      lead.push("вентилаторен конвектор");
      support.push("вентилаторни конвектори", "вентилаторен конвектор за термопомпа");
      break;
    }
    case "circulation_pump": {
      lead.push("циркулационна помпа", "циркулационна помпа за парно");
      support.push("помпа за парно");
      break;
    }
    default: {
      // Parts and other products: by what the name, or failing that the description, says they are.
      const about = normalizePhrase(`${text} ${input.description ?? ""}`);
      const says = (pattern: RegExp) => pattern.test(about);
      if (has(/филтър/) && says(/прахосмукачк|minicen|babycen/)) lead.push("филтър за прахосмукачка за пепел");
      else if (has(/прахосмукачк/)) lead.push("прахосмукачка за пепел");
      if (has(/wi ?fi/) && has(/модул/)) lead.push("wifi модул за пелетна камина");
      if (has(/(слънчев|солар)\S*/) && has(/колектор/)) {
        lead.push("слънчев колектор");
        support.push("плосък слънчев колектор", "соларен колектор за топла вода");
      }
      if (has(/тръб/) && says(/подово/)) lead.push("тръба за подово отопление");
      else if (has(/тръб/) && says(/многослойн|pex al pex/)) lead.push("многослойна тръба");
      if (has(/нагревател за лир/)) {
        lead.push("нагревател за лира");
        support.push("нагревател за лира за баня", "електрически нагревател за лира");
      }
      if (has(/кран за лир/)) lead.push("кран за лира");
      if (has(/термовентил/)) {
        lead.push("термовентил");
        support.push("термостатен вентил");
      }
      if (has(/стаен термостат/)) {
        lead.push("стаен термостат");
        if (has(/програмируем/)) support.push("програмируем стаен термостат");
        if (has(/wi fi|wifi/)) support.push("стаен термостат с wifi");
        if (has(/подово/)) support.push("стаен термостат за подово отопление");
      }
      if (has(/колектор/) && says(/подово/)) lead.push("колектор за подово отопление");
      if (has(/подложка/)) {
        lead.push("подложка за подово отопление");
        support.push("изолационна подложка за подово отопление");
      }
      if (has(/конзола/)) lead.push("конзола за радиатор");
      break;
    }
  }
  const clean = (list: string[]) => [...new Set(list.filter(Boolean).map(normalizePhrase))];
  return { lead: clean(lead), support: clean(support) };
}

const words = (phrase: string) => normalizePhrase(phrase).split(" ");

/** Whether every word of `part` is in `whole`: such a phrase adds nothing as a secondary. */
const coveredBy = (part: string, whole: string) => {
  const own = new Set(words(whole));
  return words(part).every((word) => own.has(word));
};

/** The product's target phrases, or null when none of its phrases has measurable demand. */
export function keywordTarget(input: KeywordInput): KeywordTarget | null {
  const { lead, support } = candidatePhrases(input);
  const scored = (list: string[]) =>
    list
      .map((phrase) => ({ phrase, volume: searchVolume(phrase) }))
      .filter((entry) => entry.volume >= MIN_SEARCH_VOLUME && words(entry.phrase).length >= 2)
      // The most searched first; on a tie, the more specific phrase.
      .sort((a, b) => b.volume - a.volume || words(b.phrase).length - words(a.phrase).length);
  const leads = scored(lead);
  const supports = scored(support);
  const primary = leads[0] ?? supports[0];
  if (!primary) return null;
  const secondary = [...leads.slice(1), ...supports]
    .filter((entry) => entry.phrase !== primary.phrase && !coveredBy(entry.phrase, primary.phrase))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3)
    .map((entry) => entry.phrase);
  return { primary: primary.phrase, volume: primary.volume, secondary };
}

/* --- Checking copy against the target ---------------------------------------------------------------------- */

/** Words that must match as they are. */
const FUNCTION_WORDS = new Set(["на", "за", "с", "със", "и", "в", "във", "без", "от"]);

const tokens = (text: string) => normalizePhrase(text).match(/[\p{L}\p{N}]+/gu) ?? [];

/** Bulgarian endings a phrase word may take in running text: the definite article and the plural. */
const ENDINGS = ["", "а", "я", "ът", "ят", "та", "то", "те", "и", "ите", "ия", "ият", "ове", "овете"];

/**
 * A text word matches a phrase word in its own forms only: "камината" for "камина", "котела" for "котел",
 * "панелният" for "панелен" (whose "е" drops), but not "пелетен" for "пелети", which is another word.
 */
function sameWord(textWord: string, phraseWord: string): boolean {
  if (FUNCTION_WORDS.has(phraseWord) || /\d/.test(phraseWord) || phraseWord.length <= 3) return textWord === phraseWord;
  const bases = [phraseWord];
  // The vowel a word ends with gives way to the ending ("лира" → "лири"); a fleeting "е" drops ("котел" → "котли").
  if (/[аяо]$/.test(phraseWord)) bases.push(phraseWord.slice(0, -1));
  if (/е[нлр]$/.test(phraseWord)) bases.push(phraseWord.slice(0, -2) + phraseWord.slice(-1));
  return bases.some((base) => ENDINGS.some((ending) => textWord === base + ending));
}

/** How many times the phrase appears in the text, word for word in order (any inflection, any case). */
export function phraseCount(text: string, phrase: string): number {
  const haystack = tokens(text);
  const needle = tokens(phrase);
  if (needle.length === 0) return 0;
  let count = 0;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((word, j) => sameWord(haystack[i + j]!, word))) count += 1;
  }
  return count;
}

/** Whether every content word of the phrase is in the text, in any order (a name: "Инверторен климатик Artel…"). */
export function hasPhraseWords(text: string, phrase: string): boolean {
  const haystack = tokens(text);
  return tokens(phrase)
    .filter((word) => !FUNCTION_WORDS.has(word))
    .every((word) => haystack.some((textWord) => sameWord(textWord, word)));
}

/** Why the copy misses its target; empty when it is used as it should be. */
export function checkKeywordUse(
  copy: { name: string; metaDescription: string; description: string },
  target: KeywordTarget,
): string[] {
  const problems: string[] = [];
  const phrase = target.primary;
  if (!hasPhraseWords(copy.name, phrase)) problems.push(`the name leaves out the searched phrase “${phrase}”`);
  if (phraseCount(copy.metaDescription, phrase) === 0)
    problems.push(`the meta description leaves out the searched phrase “${phrase}”`);
  const opening = copy.description.split(/\n\s*\n/)[0] ?? "";
  if (phraseCount(opening, phrase) === 0)
    problems.push(`the first paragraph leaves out the searched phrase “${phrase}”`);
  const repeats = phraseCount(copy.description, phrase);
  if (repeats > 3) problems.push(`the description repeats “${phrase}” ${repeats} times (at most 3)`);
  return problems;
}
