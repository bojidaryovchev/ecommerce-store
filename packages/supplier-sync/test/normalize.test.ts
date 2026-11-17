import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addLocks, editedLockableFields } from "../src/locks";
import { detectBrand } from "../src/normalize/brand";
import { parseMeasurement, toAttributeUnit } from "../src/normalize/measurement";
import { attributeSlugFromKey, hashNormalizedProduct, normalizeWooProduct, toCents } from "../src/normalize/product";
import { decodeEntities, fixMixedScripts, htmlToText } from "../src/normalize/text";
import { slugify, transliterateBg } from "../src/normalize/transliterate";
import { wooProductSchema } from "../src/woocommerce/schemas";

const realProduct = JSON.parse(readFileSync(new URL("./fixtures/woo-product-ac.json", import.meta.url), "utf8"));

describe("text clean-up", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeEntities("2 бр &#8211; 12&nbsp;000 BTU &amp; 1&euro; &unknown;")).toBe(
      "2 бр – 12 000 BTU & 1€ &unknown;",
    );
  });

  it("turns supplier HTML into readable lines", () => {
    const html = `<div class="x">Първи ред</p>\n<p>&nbsp;</p><ul><li>една</li><li>две</li></ul>
      <table><tr><th>Мощност</th><td>10 kW</td></tr></table><script>alert(1)</script><!-- c -->`;
    expect(htmlToText(html)).toBe("Първи ред\n\n• една\n• две\n\nМощност: 10 kW");
  });

  it("fixes words that mix look-alike Cyrillic and Latin letters", () => {
    expect(fixMixedScripts("Климатик Аrtel")).toBe("Климатик Artel"); // Cyrillic А
    expect(fixMixedScripts("Eнергиен клас")).toBe("Енергиен клас"); // Latin E
    expect(fixMixedScripts("10 кW")).toBe("10 kW"); // Cyrillic к
    expect(fixMixedScripts("BTU/h и kW")).toBe("BTU/h и kW");
  });
});

describe("transliteration", () => {
  it("follows the Bulgarian Transliteration Act", () => {
    expect(transliterateBg("Щастие Жълто Юг Цвят")).toBe("Shtastie Zhalto Yug Tsvyat");
    expect(transliterateBg("България, София")).toBe("Bulgaria, Sofia");
  });

  it("builds URL slugs", () => {
    expect(slugify("Пелетни камини")).toBe("peletni-kamini");
    expect(slugify("Климатици Artel")).toBe("klimatitsi-artel");
    expect(slugify("  Лири за баня – 50/50 мм!  ")).toBe("liri-za-banya-50-50-mm");
    expect(slugify("Crème brûlée")).toBe("creme-brulee");
    expect(slugify("а".repeat(50) + " " + "б".repeat(50), 60).length).toBeLessThanOrEqual(60);
  });

  it("derives attribute slugs from supplier keys", () => {
    expect(attributeSlugFromKey("pa_power-heating-btu")).toBe("power-heating-btu");
    expect(attributeSlugFromKey("pa_%d1%86%d0%b2%d1%8f%d1%82")).toBe("tsvyat");
    expect(attributeSlugFromKey("local:visochina")).toBe("visochina");
  });
});

describe("brands", () => {
  it("finds known brands in Latin or Cyrillic spelling", () => {
    expect(detectBrand("Пелетна камина ARTEL Nina 7")).toBe("Artel");
    expect(detectBrand("Пелетна камина Артел Nina 7")).toBe("Artel");
    expect(detectBrand("Лира Хидро Терм 500/1200")).toBe("Hydro Term");
    expect(detectBrand("Пелетен котел HydroTherm Compact 28")).toBe("Hydro Term");
    expect(detectBrand("Радиатор Ocean и Artel")).toBe("Ocean");
    expect(detectBrand("Кит комплект за радиатор ThermArt 1″")).toBe("ThermArt");
    expect(detectBrand("Artelix")).toBeNull();
  });
});

describe("measurements", () => {
  it("parses a number with an optional unit", () => {
    expect(parseMeasurement("13000 BTU/h")).toEqual({ value: 13000, unit: "BTU/h" });
    expect(parseMeasurement("10,1 kW")).toEqual({ value: 10.1, unit: "kW" });
    expect(parseMeasurement("12 000")).toEqual({ value: 12000, unit: null });
    expect(parseMeasurement("50мм")).toEqual({ value: 50, unit: "мм" });
    expect(parseMeasurement("до 85 кв.")).toEqual({ value: 85, unit: "кв." });
  });

  it("rejects ranges and sizes", () => {
    expect(parseMeasurement("от 60 до 80 кв.м.")).toBeNull();
    expect(parseMeasurement("36/50")).toBeNull();
    expect(parseMeasurement("500x1200")).toBeNull();
    expect(parseMeasurement("Бял")).toBeNull();
  });

  it("converts watts to kilowatts under a kW attribute", () => {
    expect(toAttributeUnit("мощност отопление kW", { value: 700, unit: "W" })).toEqual({ value: 0.7, unit: "kW" });
    expect(toAttributeUnit("мощност отопление kW", { value: 7.5, unit: "kW" })).toEqual({ value: 7.5, unit: "kW" });
    expect(toAttributeUnit("цвят", { value: 700, unit: "W" })).toEqual({ value: 700, unit: "W" });
  });
});

describe("normalizeWooProduct", () => {
  it("reads a real supplier product", () => {
    const product = normalizeWooProduct(wooProductSchema.parse(realProduct));
    expect(product.externalId).toBe(992013);
    expect(product.name).toBe("Климатик Artel Мултисплит система с 2 вътрешни тела-2бр по 12000 BTU Инверторен");
    expect(product.brand).toBe("Artel");
    expect(product.priceAmount).toBe(137026);
    expect(product.currency).toBe("eur");
    expect(product.inStock).toBe(true);
    expect(product.purchasable).toBe(true);
    expect(product.images).toHaveLength(4);
    expect(product.categoryExternalIds).toEqual([205]);
    expect(product.description).toContain("Енергиен клас А+++");
    expect(product.description).not.toContain("<");
    const heating = product.attributes.find((a) => a.key === "pa_power-heating-btu");
    expect(heating?.values).toEqual([{ text: "13000 BTU/h", number: 13000, unit: "BTU/h" }]);
  });

  it("treats a missing or zero price as no price", () => {
    expect(toCents("", 2)).toBeNull();
    expect(toCents("0", 2)).toBeNull();
    expect(toCents("137026", 2)).toBe(137026);
    expect(toCents("1370", 0)).toBe(137000);
    const noPrice = normalizeWooProduct(
      wooProductSchema.parse({ ...realProduct, prices: { ...realProduct.prices, price: "" } }),
    );
    expect(noPrice.priceAmount).toBeNull();
    expect(noPrice.purchasable).toBe(false);
  });

  it("hashes only what we use, independent of key order", () => {
    const a = normalizeWooProduct(wooProductSchema.parse(realProduct));
    const reordered = Object.fromEntries(Object.entries(realProduct).reverse());
    const b = normalizeWooProduct(wooProductSchema.parse({ ...reordered, price_html: "<b>other</b>" }));
    expect(hashNormalizedProduct(a)).toBe(hashNormalizedProduct(b));
    const c = normalizeWooProduct(wooProductSchema.parse({ ...realProduct, name: realProduct.name + " 2" }));
    expect(hashNormalizedProduct(c)).not.toBe(hashNormalizedProduct(a));
  });
});

describe("locks", () => {
  const current = {
    name: "Камина",
    description: "Текст",
    images: ["a.jpg"],
    categoryId: "c1",
    brand: "Artel",
    trackInventory: false,
    stockQuantity: null,
  };

  it("lists only the fields an edit actually changes", () => {
    expect(editedLockableFields(current, { ...current })).toEqual([]);
    expect(editedLockableFields(current, { name: "Камина Nina", images: undefined, description: "Текст " })).toEqual([
      "name",
    ]);
    expect(editedLockableFields(current, { images: ["b.jpg"], categoryId: "", trackInventory: true })).toEqual([
      "images",
      "categoryId",
      "stock",
    ]);
  });

  it("adds locks without duplicates", () => {
    expect(addLocks(["name"], ["name", "price"])).toEqual(["name", "price"]);
  });
});
