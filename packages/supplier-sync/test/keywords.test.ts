import { describe, expect, it } from "vitest";
import {
  checkKeywordUse,
  hasPhraseWords,
  keywordTarget,
  normalizePhrase,
  phraseCount,
  searchVolume,
} from "../src/enrich/keywords";

describe("keyword targets", () => {
  it("leads with the most searched phrase of the product's own subtype, not the category's head term", () => {
    const electric = keywordTarget({
      kind: "towel_rail",
      categorySlug: "elektricheski-liri",
      text: "Алуминиева лира Riffle 4 електрическа инокс 550/452",
      specs: [{ key: "heightMm", value: 452 }],
    });
    expect(electric?.primary).toBe("електрическа лира за баня");
    // Short enough to be "small"; "лира за баня" itself is inside the primary, so it is not repeated as secondary.
    expect(electric?.secondary).toContain("малка лира за баня");
    expect(electric?.secondary).not.toContain("лира за баня");

    const water = keywordTarget({
      kind: "towel_rail",
      categorySlug: "aluminievi-liri",
      text: "Алуминиева лира BOLD 480/900 бял мат",
      specs: [{ key: "heightMm", value: 900 }],
    });
    expect(water?.primary).toBe("алуминиева лира за баня");
    // Not called a water rail unless the data says so.
    expect(water?.secondary).not.toContain("водна лира за баня");
  });

  it("follows how buyers say it: «котел на пелети» over «пелетен котел»", () => {
    const boiler = keywordTarget({
      kind: "boiler",
      categorySlug: "peletni-kotli",
      text: "Пелетен котел Artel Idro Domus 35 Пелетни котли",
      specs: [{ key: "heatingKw", value: 32 }],
    });
    expect(boiler?.primary).toBe("котел на пелети");
    expect(boiler?.secondary).toContain("пелетен котел");
  });

  it("tells a stove with a water jacket from a dry one by its name", () => {
    const wet = keywordTarget({
      kind: "pellet_stove",
      categorySlug: "s-vodna-riza",
      text: "Пелетна камина с водна риза Artel Thermo L17",
      specs: [],
    });
    const dry = keywordTarget({
      kind: "pellet_stove",
      categorySlug: "suhi-peletni-kamini",
      text: "Пелетна камина Artel Iulia Next 8",
      specs: [],
    });
    expect(wet?.primary).toBe("пелетна камина с водна риза");
    expect(dry?.primary).toBe("суха пелетна камина");
    expect(dry?.secondary.some((phrase) => phrase.includes("водна риза") && !phrase.includes("без"))).toBe(false);
  });

  it("leaves a product without measurable demand without a target", () => {
    expect(
      keywordTarget({ kind: "accessory", categorySlug: null, text: "Розетка за лири 16х2, хром", specs: [] }),
    ).toBeNull();
    expect(searchVolume("Термопомпа въздух-вода")).toBe(searchVolume("термопомпа въздух вода"));
    expect(normalizePhrase("  Климатик   24000-BTU ")).toBe("климатик 24000 btu");
  });
});

describe("checking copy against its target", () => {
  const target = { primary: "котел на пелети", volume: 880, secondary: ["пелетен котел"] };

  it("finds the phrase in any of its forms, word for word", () => {
    expect(phraseCount("Котелът на пелети отоплява къщата.", "котел на пелети")).toBe(1);
    expect(phraseCount("Котела на пелети и котела на пелети", "котел на пелети")).toBe(2);
    expect(phraseCount("котел за пелети", "котел на пелети")).toBe(0);
    expect(hasPhraseWords("Инверторен климатик Artel Hoop Line, 24000 BTU", "климатик 24000 btu")).toBe(true);
    expect(hasPhraseWords("Пелетен котел Artel Idro Domus 35", "котел на пелети")).toBe(false);
  });

  it("asks for the phrase in the name, the meta description and the opening, and refuses stuffing", () => {
    const good = {
      name: "Котел на пелети Artel Idro Domus 35, 32 kW",
      metaDescription: "Котел на пелети Artel Idro Domus 35 с 32 kW за къща до около 250 m².",
      description: "Този котел на пелети отоплява къща до около 250 m².\n\nПодробности за монтажа.",
    };
    expect(checkKeywordUse(good, target)).toEqual([]);
    expect(checkKeywordUse({ ...good, name: "Пелетен котел Artel Idro Domus 35, 32 kW" }, target).join(" ")).toMatch(
      /the name leaves out/,
    );
    expect(
      checkKeywordUse({ ...good, description: "Подробности.\n\nТози котел на пелети." }, target).join(" "),
    ).toMatch(/first paragraph/);
    const stuffed = `${good.description} Котел на пелети. Котел на пелети. Котел на пелети.`;
    expect(checkKeywordUse({ ...good, description: stuffed }, target).join(" ")).toMatch(/repeats .* 4 times/);
  });
});
