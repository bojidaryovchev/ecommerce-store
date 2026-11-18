import { describe, expect, it } from "vitest";
import { checkCopy, rewritePrompt } from "../src/rewrite/rewrite";

const supplier =
  "Термопомпата Artel MHP 22RP24P3 е трифазна моноблок система въздух-вода с мощност 22 kW, предназначена за отопление, охлаждане и битова гореща вода.";
const original =
  "Трифазна термопомпа въздух-вода от Artel, която поема отоплението, охлаждането и топлата вода на голяма къща. " +
  "Хидравликата е във външното тяло, затова монтажът е по-лесен, а вътре в дома не заема място. " +
  "Работи с хладилен агент R32 и инверторен компресор, който плавно следва нуждата от топлина.";

describe("checkCopy", () => {
  it("accepts original copy", () => {
    expect(
      checkCopy(
        {
          description: original,
          metaDescription:
            "Термопомпа Artel MHP 22RP24P3: трифазна моноблок система въздух-вода за отопление, охлаждане и топла вода.",
        },
        { description: supplier },
      ),
    ).toBeNull();
  });

  it("refuses an eight-word run taken from the supplier", () => {
    // Seven words in a row are a coincidence; eight are copied.
    const seven = `${original} Тя е трифазна моноблок система въздух-вода с голяма мощност.`;
    const lifted = `${original} Тя е трифазна моноблок система въздух-вода с мощност 22 kW, предназначена за отопление.`;
    expect(checkCopy({ description: seven, metaDescription: "x".repeat(140) }, { description: supplier })).toBeNull();
    expect(checkCopy({ description: lifted, metaDescription: "x".repeat(140) }, { description: supplier })).toMatch(
      /8-word/,
    );
  });

  it("refuses copy that is too short", () => {
    expect(checkCopy({ description: "Кратко.", metaDescription: "x".repeat(140) }, { description: supplier })).toMatch(
      /too short/,
    );
    expect(checkCopy({ description: original, metaDescription: "Кратко." }, { description: supplier })).toMatch(/meta/);
  });
});

describe("rewritePrompt", () => {
  it("gives the model the facts and fences the supplier text", () => {
    const prompt = rewritePrompt({
      id: "p1",
      name: "Термопомпа Artel MHP 22RP24P3",
      brand: "Artel",
      description: supplier,
      category: "Термопомпи моноблок",
      specs: [{ name: "мощност отопление kW", value: "22 kW" }],
    });
    expect(prompt).toContain("Brand: Artel");
    expect(prompt).toContain("- мощност отопление kW: 22 kW");
    expect(prompt).toContain(`<<<\n${supplier}\n>>>`);
  });
});
