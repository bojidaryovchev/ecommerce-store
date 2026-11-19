import { describe, expect, it } from "vitest";
import { energyLabelInfo, eprelRegistration } from "../src/enrich/energy-label";
import { productGaps } from "../src/enrich/gaps";
import type { ValidateOutput } from "../src/enrich/outputs";

const attribute = (slug: string, value: string, numericValue: number | null = null) => ({ slug, value, numericValue });

describe("the energy label", () => {
  it("colours the arrow by the class's place in its product group's scale", () => {
    // Heat pumps run A+++ to D: A+++ is the top (dark green), D the bottom (red).
    expect(energyLabelInfo("heat_pump", [attribute("energy-class-heating", "A+++")]).arrows).toEqual([
      { function: "heating", value: "A+++", colour: "#00A651" },
    ]);
    expect(energyLabelInfo("heat_pump", [attribute("energy-class-heating", "d")]).arrows[0]?.colour).toBe("#ED1C24");
    // Pellet stoves run A++ to G: A++ is their top, and every class after the sixth is red.
    expect(energyLabelInfo("pellet_stove", [attribute("energy-class", "A++")]).arrows[0]?.colour).toBe("#00A651");
    expect(energyLabelInfo("pellet_stove", [attribute("energy-class", "F")]).arrows[0]?.colour).toBe("#ED1C24");
    // A class outside the scale is a data error, not an arrow.
    expect(energyLabelInfo("pellet_stove", [attribute("energy-class", "A+++")]).arrows).toEqual([]);
  });

  it("draws both of an air conditioner's classes, cooling first", () => {
    const { arrows } = energyLabelInfo("air_conditioner", [
      attribute("energy-class-heating", "A+"),
      attribute("energy-class-cooling", "A++"),
    ]);
    expect(arrows.map((arrow) => `${arrow.function}:${arrow.value}`)).toEqual(["cooling:A++", "heating:A+"]);
  });

  it("knows which products the rules cover, and never lets one off for an unknown output", () => {
    expect(energyLabelInfo("towel_rail", []).required).toBe(false);
    expect(energyLabelInfo("boiler", [attribute("power-heating", "35 kW", 35)]).required).toBe(true);
    // Boilers over 70 kW and air conditioners over 12 kW are beyond the labelling rules.
    expect(energyLabelInfo("boiler", [attribute("power-heating", "116 kW", 116)]).required).toBe(false);
    expect(energyLabelInfo("air_conditioner", [attribute("cooling-power", "14 kW", 14)]).required).toBe(false);
    expect(energyLabelInfo("pellet_stove", []).required).toBe(true);
  });

  it("reads the registration number from an EPREL link", () => {
    expect(eprelRegistration("https://eprel.ec.europa.eu/screen/product/airconditioners/1234567")).toBe("1234567");
    expect(eprelRegistration("https://example.com/label.png")).toBeNull();
    expect(eprelRegistration(null)).toBeNull();
  });

  it("lists the label and the fiche as missing until the shop has them", () => {
    const validate = {
      kind: "heat_pump",
      specs: [
        {
          key: "heatingKw",
          value: 6.65,
          text: "6,65 kW",
          numeric: 6.65,
          condition: null,
          source: "web",
          url: null,
          confidence: "high",
        },
      ],
      dropped: [],
      conflicts: [],
      problems: [],
      notices: [],
      omit: [],
      supersede: [],
      gtin: null,
      mpn: null,
    } as ValidateOutput;
    expect(productGaps(validate, []).documents.map((gap) => gap.key)).toEqual(["energyLabel", "productFiche"]);
    // An EPREL page carries the label as well as the fiche.
    const eprel = { metadata: { productFiche: "https://eprel.ec.europa.eu/screen/product/spaceheaters/42" } };
    expect(productGaps(validate, [], eprel).documents).toEqual([]);
    expect(productGaps(validate, [], { media: { labels: ["/label.png"] } }).documents.map((gap) => gap.key)).toEqual([
      "productFiche",
    ]);
  });
});
