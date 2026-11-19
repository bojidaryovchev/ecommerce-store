import { describe, expect, it } from "vitest";
import type { FaqItem } from "../src/enrich/contract";
import { checkFaqAnswer, needsFaqWork, searchesFor, summarizeSpecs } from "../src/enrich/faq";

const item = (overrides: Partial<FaqItem> = {}): FaqItem => ({
  slug: "termopompi",
  name: "Термопомпи",
  parent: null,
  subcategories: ["Термопомпи моноблок"],
  description: null,
  sectionNotes: null,
  facts: { products: 10, brands: [], specs: [] },
  installation: null,
  searches: [],
  answeredAbove: [],
  previous: null,
  ...overrides,
});

const answer = (count: number, text = "Зависи от топлинните загуби на дома и от това дали къщата е изолирана.") => ({
  slug: "termopompi",
  questions: Array.from({ length: count }, (_, i) => ({
    question: `Какво да проверя преди покупка, точка ${i + 1}?`,
    answer: text,
  })),
});

describe("summarizeSpecs", () => {
  it("gives a figure's range with its unit, and the values found with their counts", () => {
    const values = [
      { productId: "a", name: "мощност отопление", value: "4 kW" },
      { productId: "b", name: "мощност отопление", value: "8,5 kW" },
      { productId: "c", name: "мощност отопление", value: "16 kW" },
      { productId: "a", name: "хладилен агент", value: "R32" },
      { productId: "b", name: "хладилен агент", value: "R32" },
      { productId: "c", name: "хладилен агент", value: "R290" },
      { productId: "a", name: "рядко", value: "x" },
    ];
    expect(summarizeSpecs(values, 3)).toEqual([
      { name: "Мощност отопление", summary: "4–16 kW (3 of 3 products)" },
      { name: "Хладилен агент", summary: "R32 (2), R290 (1); 3 of 3 products" },
    ]);
  });

  it("does not turn figures in different units into one range", () => {
    const values = [
      { productId: "a", name: "мощност", value: "9000 BTU" },
      { productId: "b", name: "мощност", value: "2,6 kW" },
    ];
    expect(summarizeSpecs(values, 2)[0]!.summary).toBe("9000 BTU (1), 2,6 kW (1); 2 of 2 products");
  });
});

describe("searchesFor", () => {
  it("takes a category's searches, the most searched first, without laundry dryers, shops or towns", () => {
    const searches = searchesFor("termopompi");
    expect(searches[0]).toEqual({ phrase: "термопомпа", volume: 5400 });
    expect(searches.length).toBeLessThanOrEqual(20);
    expect(searches.some((s) => s.phrase.includes("сушилн"))).toBe(false);
    expect(searches.some((s) => s.phrase === "буферен съд за термопомпа")).toBe(true);
    const volumes = searches.map((s) => s.volume);
    expect(volumes).toEqual([...volumes].sort((a, b) => b - a));
  });

  it("matches the words in any form", () => {
    expect(searchesFor("panelni-radiatori").some((s) => s.phrase === "панелен радиатор")).toBe(true);
    expect(searchesFor("aluminievi-radiatori").some((s) => s.phrase === "алуминиеви радиатори")).toBe(true);
  });
});

describe("checkFaqAnswer", () => {
  it("passes a well-formed draft", () => {
    expect(checkFaqAnswer(item(), answer(5), true)).toEqual([]);
  });

  it("wants 5 to 7 questions on a top-level page and 3 to 5 on a section", () => {
    expect(checkFaqAnswer(item(), answer(4), true)[0]).toContain("5 to 7");
    expect(checkFaqAnswer(item({ parent: "Термопомпи" }), answer(3), false)).toEqual([]);
    expect(checkFaqAnswer(item({ parent: "Термопомпи" }), answer(6), false)[0]).toContain("3 to 5");
  });

  it("refuses prices, links, lists and exclamation marks", () => {
    const issues = (text: string) => checkFaqAnswer(item(), answer(5, text), true).join(" ");
    expect(issues("Моделите в каталога започват от 2 400 € с ДДС и стигат до доста повече.")).toContain("prices");
    expect(issues("Цената е около 1500 лв. за малките модели, а големите са по-скъпи.")).toContain("prices");
    expect(issues("Вижте повече на www.example.com, където има подробно описание на всичко.")).toContain("links");
    expect(issues("Има няколко вида:\n- моноблок\n- сплит, и двата са подходящи за дома ви.")).toContain("Markdown");
    expect(issues("Да! Всички модели в каталога работят отлично и при ниски температури навън.")).toContain(
      "exclamation",
    );
  });

  it("refuses a question without its question mark, in English, asked twice or asked above", () => {
    const draft = answer(5);
    draft.questions[0]!.question = "Какво да проверя преди покупка";
    expect(checkFaqAnswer(item(), draft, true).join(" ")).toContain("question mark");

    const english = answer(5, "It depends on the heat loss of the house and on its insulation, mostly.");
    expect(checkFaqAnswer(item(), english, true).join(" ")).toContain("Bulgarian");

    const twice = answer(5);
    twice.questions[1]!.question = twice.questions[0]!.question;
    expect(checkFaqAnswer(item(), twice, true).join(" ")).toContain("ask the same");

    const section = item({ parent: "Термопомпи", answeredAbove: ["Какво да проверя преди покупка, точка 1?"] });
    expect(checkFaqAnswer(section, answer(3), false).join(" ")).toContain("parent category");
  });
});

describe("needsFaqWork", () => {
  const row = (status: "published" | "revise" | "held" | "failed", source: "generated" | "admin" = "generated") =>
    ({ status, source }) as Parameters<typeof needsFaqWork>[0];

  it("writes new and sent-back questions, the rest only on --force, and never the admin's", () => {
    expect(needsFaqWork(undefined, false)).toBe(true);
    expect(needsFaqWork(row("revise"), false)).toBe(true);
    expect(needsFaqWork(row("published"), false)).toBe(false);
    expect(needsFaqWork(row("held"), false)).toBe(false);
    expect(needsFaqWork(row("published"), true)).toBe(true);
    expect(needsFaqWork(row("published", "admin"), true)).toBe(false);
  });
});
