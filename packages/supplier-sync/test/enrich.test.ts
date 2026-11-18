import { describe, expect, it } from "vitest";
import {
  SessionError,
  childEnvironment,
  classifyFailure,
  claudeArgs,
  parseClaudeEnvelope,
  type SessionRequest,
} from "../src/enrich/claude";
import {
  COPY_OUTPUT_JSON_SCHEMA,
  RESEARCH_OUTPUT_JSON_SCHEMA,
  copyProductSchema,
  parseAnswers,
  researchProductSchema,
  type CopyItem,
  type ResearchAnswer,
} from "../src/enrich/contract";
import { checkCopyAnswer, copiedRun, figureSpellings, modelTokens } from "../src/enrich/copy";
import { KINDS, SPEC_FIELDS, effectiveKind, formatSpecValue, kindOfCategory } from "../src/enrich/fields";
import { guessImageKind } from "../src/enrich/images";
import { researchBatches } from "../src/enrich/run";
import type { EnrichProduct } from "../src/enrich/state";
import {
  convertUnit,
  isValidGtin,
  nameFigures,
  normalizeSpecValue,
  toDeltaT50,
  validateResearch,
} from "../src/enrich/validate";

/* --- Fixtures ------------------------------------------------------------------------------------------- */

function answer(overrides: Partial<ResearchAnswer> = {}): ResearchAnswer {
  return {
    id: "p1",
    kind: "heat_pump",
    category: null,
    identity: { brand: "Artel", model: "MHP 5RP24", nominal: null },
    gtin: null,
    mpn: null,
    specs: [
      {
        key: "heatingKw",
        value: 4.65,
        condition: "A7/W35",
        source: "supplier_image",
        url: null,
        confidence: "high",
      },
      { key: "scop", value: 4.47, condition: "35 °C", source: "supplier_image", url: null, confidence: "high" },
      { key: "refrigerant", value: "R-32", condition: null, source: "supplier_image", url: null, confidence: "high" },
      { key: "phase", value: "1 Ph", condition: null, source: "supplier_image", url: null, confidence: "high" },
      { key: "soundPowerDb", value: 61, condition: null, source: "supplier_image", url: null, confidence: "high" },
    ],
    features: ["Вграден Wi-Fi модул"],
    images: [],
    sources: [],
    note: "",
    ...overrides,
  };
}

const POWER_17_6 = {
  slug: "power-heating",
  name: "мощност отопление kW",
  unit: "kW",
  value: "17.6 kW",
  numericValue: 17.6,
};

/* --- The model call --------------------------------------------------------------------------------------- */

describe("claude CLI arguments", () => {
  const request: SessionRequest = {
    skill: "catalog-research",
    workspace: "/tmp/ws",
    batchFile: "batch.json",
    schema: RESEARCH_OUTPUT_JSON_SCHEMA,
    web: true,
    images: [],
    maxTurns: 40,
    timeoutMs: 60_000,
  };
  const args = claudeArgs(request, { model: "claude-opus-5-5" });
  const value = (flag: string) => args[args.indexOf(flag) + 1];

  it("invokes the skill on the batch file with the output contract", () => {
    expect(value("-p")).toBe("/catalog-research batch.json");
    expect(JSON.parse(value("--json-schema")!)).toEqual(RESEARCH_OUTPUT_JSON_SCHEMA);
  });

  it("allows reading the workspace and the web, and nothing that runs or writes", () => {
    expect(value("--tools")).toBe("Read,WebSearch,WebFetch");
    expect(value("--allowedTools")).toBe("Read(./**),WebSearch,WebFetch");
    expect(args.join(" ")).not.toMatch(/Bash|Edit|Write|bypassPermissions/);
    expect(args).toContain("--strict-mcp-config");
    expect(value("--setting-sources")).toBe("project");
    expect(value("--permission-mode")).toBe("dontAsk");
    expect(value("--permission-prompts")).toBe("none");
  });

  it("gives the copy sessions no web", () => {
    const copy = claudeArgs({ ...request, skill: "catalog-copy", web: false }, { model: "m" });
    expect(copy[copy.indexOf("--tools") + 1]).toBe("Read");
    expect(copy.join(" ")).not.toMatch(/WebSearch|WebFetch/);
  });

  it("hands the CLI none of this process's secrets, nor the parent session's markers", () => {
    const env = childEnvironment({
      PATH: "/usr/bin",
      Path: "C:\\Windows",
      SystemRoot: "C:\\Windows",
      CLAUDE_CODE_OAUTH_TOKEN: " sk-ant-oat01-abc\n def ",
      ANTHROPIC_API_KEY: "",
      DATABASE_URL: "postgres://user:secret@host/db",
      CLAUDECODE: "1",
      CLAUDE_CODE_SESSION_ID: "x",
    });
    expect(env).toEqual({
      PATH: "/usr/bin",
      Path: "C:\\Windows",
      SystemRoot: "C:\\Windows",
      CLAUDE_CODE_OAUTH_TOKEN: "sk-ant-oat01-abcdef",
    });
  });
});

describe("parseClaudeEnvelope", () => {
  it("returns the structured output", () => {
    const parsed = parseClaudeEnvelope(
      JSON.stringify({ subtype: "success", is_error: false, structured_output: { products: [] }, num_turns: 3 }),
    );
    expect(parsed).toEqual({ output: { products: [] }, costUsd: null, turns: 3 });
  });

  it("charges running out of turns to the batch, and a usage limit to nobody", () => {
    const fail = (envelope: object) => {
      try {
        parseClaudeEnvelope(JSON.stringify(envelope));
      } catch (error) {
        return (error as SessionError).failure;
      }
      return null;
    };
    expect(fail({ subtype: "error_max_turns", is_error: true, result: "usage limit" })).toBe("batch");
    expect(fail({ subtype: "success", is_error: true, result: "Claude AI usage limit reached" })).toBe("service");
    expect(fail({ subtype: "success", is_error: true, result: "Invalid API key · Please run /login" })).toBe("setup");
  });

  it("classifies by what the CLI says, not by any number on a page", () => {
    expect(classifyFailure("API Error: 529 Overloaded")).toBe("service");
    expect(classifyFailure("WebFetch returned 403 for the page")).toBe("batch");
  });
});

describe("output contract", () => {
  it("the JSON Schema says what the zod schema says", () => {
    const item = (RESEARCH_OUTPUT_JSON_SCHEMA as { properties: { products: { items: { required: string[] } } } })
      .properties.products.items;
    expect([...item.required].sort()).toEqual(Object.keys(researchProductSchema.shape).sort());
    expect(researchProductSchema.safeParse(answer()).success).toBe(true);
    const copy = (COPY_OUTPUT_JSON_SCHEMA as { properties: { products: { items: { required: string[] } } } }).properties
      .products.items;
    expect([...copy.required].sort()).toEqual(["description", "id", "metaDescription", "name"]);
  });

  it("costs only the product whose answer is malformed, and notes ids nobody asked for", () => {
    const parsed = parseAnswers(
      { products: [answer({ id: "a" }), { id: "b", kind: "spaceship" }, answer({ id: "z" })] },
      researchProductSchema,
      ["a", "b", "c"],
    );
    expect([...parsed.answers.keys()]).toEqual(["a"]);
    expect(parsed.invalid.has("b")).toBe(true);
    expect(parsed.invalid.get("c")).toMatch(/no answer/);
    expect(parsed.stray).toEqual(["z"]);
  });
});

/* --- Fields ------------------------------------------------------------------------------------------- */

describe("fields", () => {
  it("formats values the Bulgarian way", () => {
    expect(formatSpecValue("heatingKw", 4.65)).toBe("4,65 kW");
    expect(formatSpecValue("efficiencyPct", 92.5)).toBe("92,5 %");
    expect(formatSpecValue("coolingBtu", 12000)).toBe("12000 BTU/h");
    expect(formatSpecValue("wifi", true)).toBe("Да");
    expect(formatSpecValue("scop", 4.471)).toBe("4,47");
  });

  it("maps every curated category to a kind, and every kind's fields to the registry", () => {
    expect(kindOfCategory("monoblok")).toBe("heat_pump");
    expect(kindOfCategory("dizaynerski-liri")).toBe("towel_rail");
    expect(kindOfCategory("nonexistent")).toBeNull();
    for (const kind of Object.values(KINDS)) {
      for (const key of Object.keys(kind.fields)) expect(SPEC_FIELDS).toHaveProperty(key);
    }
  });

  it("checks a part sold in a unit's category as a part, and otherwise goes by the category", () => {
    expect(effectiveKind("radiator", "accessory")).toBe("accessory");
    expect(effectiveKind("radiator", "towel_rail")).toBe("radiator");
    expect(effectiveKind(null, "boiler")).toBe("boiler");
    expect(effectiveKind(null, undefined, "other")).toBe("other");
  });
});

/* --- Validation ------------------------------------------------------------------------------------------- */

describe("validateResearch", () => {
  it("normalises what it accepts", () => {
    const result = validateResearch({
      name: "Термопомпа Artel MHP 5RP24",
      kind: "heat_pump",
      categorySlug: "split",
      research: answer(),
      supplierAttributes: [],
    });
    expect(result.problems).toEqual([]);
    const byKey = Object.fromEntries(result.specs.map((spec) => [spec.key, spec]));
    expect(byKey.refrigerant!.value).toBe("R32");
    expect(byKey.phase!.value).toBe("Монофазно (230 V)");
    expect(byKey.heatingKw!.text).toBe("4,65 kW");
  });

  it("settles the supplier's 17.6 kW against a name that says 5 kW (the live case)", () => {
    const result = validateResearch({
      name: "АРТЕЛ – ТЕРМОПОМПА ARTEL R32 MONO 5KW",
      kind: "heat_pump",
      categorySlug: "monoblok",
      research: answer(),
      supplierAttributes: [POWER_17_6],
    });
    expect(result.problems).toEqual([]);
    expect(result.conflicts).toEqual([{ key: "heatingKw", supplier: "17.6 kW", found: "4,65 kW", resolution: "name" }]);
    expect(result.supersede).toContain("power-heating");
    // R32 monoblock ≤ 12 kW: the F-gas notice.
    expect(result.notices.join(" ")).toMatch(/F-gas/);
  });

  it("sends a contradiction nobody can settle to review, and keeps the figure out of the copy", () => {
    const result = validateResearch({
      name: "Термопомпа Artel MHP 5RP24",
      kind: "heat_pump",
      categorySlug: "split",
      research: answer(),
      supplierAttributes: [POWER_17_6],
    });
    expect(result.problems.join(" ")).toMatch(/17.6 kW.*4,65 kW/);
    expect(result.omit).toContain("heatingKw");
  });

  it("refuses a name that contradicts the specs", () => {
    const result = validateResearch({
      name: "Термопомпа Artel Mono 9 kW",
      kind: "heat_pump",
      categorySlug: "monoblok",
      research: answer(),
      supplierAttributes: [],
    });
    expect(result.problems.join(" ")).toMatch(/name says 9 kW/);
    expect(result.omit).toContain("heatingKw");
  });

  it("drops what is out of range, of another kind, or uncertain, and asks for what is missing", () => {
    const result = validateResearch({
      name: "Термопомпа Artel",
      kind: "heat_pump",
      categorySlug: null,
      research: answer({
        specs: [
          { key: "scop", value: 45, condition: null, source: "web", url: null, confidence: "high" },
          { key: "hopperKg", value: 20, condition: null, source: "web", url: null, confidence: "high" },
          { key: "cop", value: 4.1, condition: null, source: "web", url: null, confidence: "low" },
        ],
      }),
      supplierAttributes: [],
    });
    expect(result.specs).toEqual([]);
    expect(result.dropped.map((d) => d.reason)).toEqual(["outside 2.5–7", "not a heat pump field", "low confidence"]);
    expect(result.problems.join(" ")).toMatch(/SCOP 45 is outside/);
    expect(result.problems.join(" ")).toMatch(/Missing Мощност отопление/);
  });

  it("converts the supplier's kW to the field's W before comparing", () => {
    const result = validateResearch({
      name: "Алуминиева лира Bold 480/900",
      kind: "towel_rail",
      categorySlug: "aluminievi-liri",
      research: answer({
        kind: "towel_rail",
        specs: [
          { key: "outputW", value: 700, condition: "ΔT50", source: "supplier_text", url: null, confidence: "high" },
        ],
      }),
      supplierAttributes: [{ ...POWER_17_6, value: "700 W", numericValue: 0.7 }],
    });
    expect(result.conflicts).toEqual([]);
    expect(result.supersede).toEqual(["power-heating"]);
    expect(result.problems).toEqual([]);
  });

  it("compares the supplier's radiator output with the figure as rated, not with its ΔT50 conversion", () => {
    const radiator = (supplierWatts: number, foundWatts: number) =>
      validateResearch({
        name: "Панелен радиатор 300/1000 Ocean тип 22",
        kind: "radiator",
        categorySlug: "aluminievi-radiatori",
        research: answer({
          kind: "radiator",
          specs: [
            {
              key: "outputW",
              value: foundWatts,
              condition: "90/75/18",
              source: "supplier_image",
              url: null,
              confidence: "high",
            },
          ],
        }),
        supplierAttributes: [{ ...POWER_17_6, value: `${supplierWatts} W`, numericValue: supplierWatts / 1000 }],
      });
    // The supplier's 1285 W and the table's 1285 W at 90/75/18 agree; the shop shows 923 W at ΔT50.
    const agreed = radiator(1285, 1285);
    expect(agreed.conflicts).toEqual([]);
    expect(agreed.problems).toEqual([]);
    expect(agreed.specs.find((spec) => spec.key === "outputW")?.text).toBe("923 W");
    // The live typo: the field says 2962 W where the supplier's own table says 1962 W.
    expect(radiator(2962, 1962).conflicts.map((conflict) => conflict.resolution)).toEqual(["review"]);
  });

  it("accepts the 36 mm bottom-centre connection of a designer towel rail, not a figure in cm", () => {
    const rail = (centreDistanceMm: number) =>
      validateResearch({
        name: "Алуминиева лира Guardian 15 450/1300",
        kind: "towel_rail",
        categorySlug: "aluminievi-liri",
        research: answer({
          kind: "towel_rail",
          specs: [
            {
              key: "centreDistanceMm",
              value: centreDistanceMm,
              condition: null,
              source: "supplier_image",
              url: null,
              confidence: "medium",
            },
            {
              key: "outputW",
              value: 795,
              condition: "75/65/20",
              source: "supplier_text",
              url: null,
              confidence: "high",
            },
          ],
        }),
        supplierAttributes: [],
      });
    expect(rail(36).problems).toEqual([]);
    expect(rail(5).problems.join(" ")).toMatch(/Междуосие 5 мм is outside/);
  });

  it("keeps a valid GTIN and drops a bad one", () => {
    expect(isValidGtin("4006381333931")).toBe(true);
    expect(isValidGtin("4006381333932")).toBe(false);
    const result = validateResearch({
      name: "X",
      kind: "accessory",
      categorySlug: null,
      research: answer({ kind: "accessory", specs: [], gtin: "4006381333932" }),
      supplierAttributes: [],
    });
    expect(result.gtin).toBeNull();
    expect(result.notices.join(" ")).toMatch(/GTIN/);
  });

  it("tells single- from three-phase without reading the 3 in 230 V", () => {
    const phase = (text: string) => {
      const result = normalizeSpecValue("phase", text);
      return result.ok ? result.value : null;
    };
    expect(phase("Монофазно (230 V)")).toBe("Монофазно (230 V)");
    expect(phase("1 Ph / 220-240 V / 50 Hz")).toBe("Монофазно (230 V)");
    expect(phase("монофазна")).toBe("Монофазно (230 V)");
    expect(phase("3N~ 400 V")).toBe("Трифазно (400 V)");
    expect(phase("трифазна")).toBe("Трифазно (400 V)");
    expect(phase("380-415V 3Ph")).toBe("Трифазно (400 V)");
    expect(phase("50 Hz")).toBeNull();
  });

  it("reads figures in names in their usual spellings", () => {
    expect(nameFigures("ARTEL R32 MONO 5KW")).toEqual([{ value: 5, unit: "kW" }]);
    expect(nameFigures("Климатик 12000 BTU")).toEqual([{ value: 12000, unit: "BTU/h" }]);
    expect(nameFigures("Лира 500 W, R32 2,5 kW")).toEqual([
      { value: 500, unit: "W" },
      { value: 2.5, unit: "kW" },
    ]);
    expect(nameFigures("MHP 12RL24")).toEqual([]);
    expect(convertUnit(0.7, "kW", "W")).toBe(700);
  });
});

/* --- Copy ------------------------------------------------------------------------------------------------- */

const SUPPLIER =
  "Термопомпата Artel MHP 22RP24P3 е трифазна моноблок система въздух-вода с мощност 22 kW, предназначена за отопление, охлаждане и битова гореща вода. ПОИСКАЙТЕ ОФЕРТА";

function copyItem(overrides: Partial<CopyItem> = {}): CopyItem {
  return {
    id: "p1",
    currentName: "Термопомпа Artel MHP 22RP24P3",
    brand: "Artel",
    model: "MHP 22RP24P3",
    kind: "heat_pump",
    category: "Термопомпи моноблок",
    sectionNotes: null,
    specs: [],
    features: [],
    omit: [],
    supplierDescription: SUPPLIER,
    siblings: [],
    keywords: null,
    retry: null,
    previous: null,
    ...overrides,
  };
}

const ORIGINAL =
  "Трифазна термопомпа въздух-вода от Artel, която поема отоплението, охлаждането и топлата вода на голяма къща. " +
  "Хидравликата е във външното тяло, затова монтажът е по-лесен, а вътре в дома не заема място. " +
  "Работи с хладилен агент R32 и инверторен компресор, който плавно следва нуждата от топлина.";

const GOOD = {
  id: "p1",
  name: "Термопомпа въздух-вода Artel MHP 22RP24P3",
  metaDescription:
    "Термопомпа въздух-вода Artel MHP 22RP24P3: трифазна моноблок система за отопление, охлаждане и топла вода на голяма къща.",
  description: ORIGINAL,
};

describe("the copy gate", () => {
  it("passes original copy", () => {
    expect(checkCopyAnswer(GOOD, { item: copyItem(), forbiddenFigures: [] })).toEqual([]);
  });

  it("refuses an eight-word run taken from the supplier, not seven", () => {
    const seven = `${ORIGINAL} Тя е трифазна моноблок система въздух-вода с голяма мощност.`;
    const lifted = `${ORIGINAL} Тя е трифазна моноблок система въздух-вода с мощност 22 kW, предназначена за отопление.`;
    expect(checkCopyAnswer({ ...GOOD, description: seven }, { item: copyItem(), forbiddenFigures: [] })).toEqual([]);
    expect(
      checkCopyAnswer({ ...GOOD, description: lifted }, { item: copyItem(), forbiddenFigures: [] }).join(" "),
    ).toMatch(/8-word/);
    expect(copiedRun("едно две три", null)).toBeNull();
  });

  it("refuses the supplier's call to action, name, contacts, prices and shouting", () => {
    const problems = (extra: string) =>
      checkCopyAnswer(
        { ...GOOD, description: `${ORIGINAL} ${extra}` },
        { item: copyItem(), forbiddenFigures: [] },
      ).join(" ");
    expect(problems("Поискайте оферта днес.")).toMatch(/offer/);
    expect(problems("Внася се от Хидро Терм ЕООД.")).toMatch(/supplier's company/);
    expect(problems("Сайтът hydrotermbg.com го предлага.")).toMatch(/company|web address/);
    // The brand of the supplier's own boilers is a brand like any other, spelled as the shop spells it.
    expect(problems("Котлите Hydro Term се почистват лесно.")).toBe("");
    expect(problems("Котлите Hydrotherm се почистват лесно.")).toMatch(/Hydro Term/);
    expect(problems("Обадете се на 0888 123 456.")).toMatch(/phone/);
    expect(problems("Вижте www.example.bg за подробности.")).toMatch(/web address/);
    expect(problems("Цената е 3200 лв. с ДДС.")).toMatch(/price/);
    expect(problems("Страхотен избор!")).toMatch(/exclamation/);
    expect(problems("Най-добрата термопомпа.")).toMatch(/superlative/);
    expect(problems("Гаранцията е 5 години.")).toMatch(/warranty/);
  });

  it("wants the brand and the model in the name, in normal capitals", () => {
    const named = (name: string) =>
      checkCopyAnswer({ ...GOOD, name }, { item: copyItem(), forbiddenFigures: [] }).join(" ");
    expect(named("Термопомпа въздух-вода MHP 22RP24P3")).toMatch(/brand Artel/);
    expect(named("Термопомпа въздух-вода Artel")).toMatch(/22RP24P3/);
    expect(named("ТЕРМОПОМПА ВЪЗДУХ-ВОДА ARTEL MHP 22RP24P3")).toMatch(/capitals/);
    expect(named("Термопомпа Artel MHP22RP24P3")).toBe("");
    expect(modelTokens("MHP 22RP24P3", "x")).toEqual(["22RP24P3"]);
  });

  it("refuses a figure in doubt, in any spelling", () => {
    const description = `${ORIGINAL} Мощността на отопление е 17,6 kW.`;
    expect(
      checkCopyAnswer(
        { ...GOOD, description },
        { item: copyItem(), forbiddenFigures: figureSpellings("17.6 kW") },
      ).join(" "),
    ).toMatch(/17.6 kW, which is in doubt/);
  });

  it("checks the meta description's length", () => {
    expect(
      checkCopyAnswer({ ...GOOD, metaDescription: "Кратко." }, { item: copyItem(), forbiddenFigures: [] }).join(" "),
    ).toMatch(/meta description is 7/);
    expect(copyProductSchema.safeParse(GOOD).success).toBe(true);
  });
});

/* --- Plumbing ----------------------------------------------------------------------------------------------- */

function product(id: string, overrides: Partial<EnrichProduct> = {}): EnrichProduct {
  return {
    id,
    slug: id,
    name: id,
    description: null,
    active: true,
    brand: "Artel",
    lockedFields: [],
    metadata: {},
    images: [],
    category: null,
    section: null,
    kind: "towel_rail",
    supplierId: null,
    supplierProductId: null,
    source: {
      name: id,
      description: null,
      brand: "Artel",
      sku: null,
      attributes: [],
      images: [],
      categoryExternalIds: [],
    },
    attributeValues: [],
    supplierAttributes: [],
    stages: {},
    ...overrides,
  };
}

describe("research batches", () => {
  it("keeps a family together and gives researched families fewer to a batch", () => {
    const text =
      "Обща дълга характеристика на серията, достатъчно дълга, за да се смята за обща за всички размери в нея.";
    const family = ["a", "b", "c"].map((id) =>
      product(id, { kind: "heat_pump", source: { ...product(id).source, description: text } }),
    );
    const singles = ["x", "y", "z", "w"].map((id) => product(id, { kind: "heat_pump" }));
    const batches = researchBatches([...singles, ...family], 8);
    expect(
      batches
        .find((batch) => batch.some((p) => p.id === "a"))!
        .map((p) => p.id)
        .sort(),
    ).toEqual(expect.arrayContaining(["a", "b", "c"]));
    for (const batch of batches) {
      const families = new Set(batch.map((p) => p.source.description ?? p.source.name));
      expect(families.size).toBeLessThanOrEqual(2);
    }
  });

  it("splits a family larger than a batch", () => {
    const text =
      "Обща дълга характеристика на серията, достатъчно дълга, за да се смята за обща за всички размери в нея.";
    const family = Array.from({ length: 11 }, (_, index) =>
      product(`f${index}`, { source: { ...product("f").source, name: `f${index}`, description: text } }),
    );
    const sizes = researchBatches(family, 8).map((batch) => batch.length);
    expect(sizes).toEqual([8, 3]);
  });
});

describe("images", () => {
  it("guesses only the clear cases", () => {
    expect(guessImageKind("https://x/wp-content/uploads/CE.png", 400, 400)).toBe("badge");
    expect(guessImageKind("https://x/Artel_icona_heat_pumps_display_200x200.png", 200, 200)).toBe("icon");
    expect(guessImageKind("https://x/tiny.png", 64, 64)).toBe("icon");
    expect(guessImageKind("https://x/Artel_heat_pump_mono.png", 1200, 900)).toBeNull();
  });
});

describe("radiator output", () => {
  it("brings an output rated at another temperature to ΔT50", () => {
    expect(toDeltaT50(1285, "90/75/18")).toBe(923);
    expect(toDeltaT50(1000, "ΔT60")).toBe(789);
    expect(toDeltaT50(900, "75/65/20")).toBeNull();
    expect(toDeltaT50(900, "ΔT50")).toBeNull();
    expect(toDeltaT50(900, null)).toBeNull();
  });

  it("publishes the converted figure, saying where it came from", () => {
    const result = validateResearch({
      name: "Панелен радиатор Ocean Тип 22 300x1000",
      kind: "radiator",
      categorySlug: "panelni-radiatori",
      research: answer({
        kind: "radiator",
        specs: [
          {
            key: "outputW",
            value: 1285,
            condition: "90/75/18",
            source: "supplier_text",
            url: null,
            confidence: "high",
          },
        ],
      }),
      supplierAttributes: [],
    });
    expect(result.problems).toEqual([]);
    expect(result.specs[0]).toMatchObject({ value: 923, text: "923 W", condition: "ΔT50, from 90/75/18" });
  });
});
