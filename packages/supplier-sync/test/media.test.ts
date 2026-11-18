import { describe, expect, it } from "vitest";
import { deriveMedia } from "../src/media";

const kinds = new Map([
  ["icon-wifi.png", { kind: "icon" as const, label: "Wi-Fi" }],
  ["icon-wifi-2.png", { kind: "icon" as const, label: "wi-fi" }],
  ["ce.png", { kind: "badge" as const, label: "CE" }],
  ["label.jpg", { kind: "energy_label" as const, label: "A+++" }],
  ["table.png", { kind: "spec_table" as const, label: null }],
  ["schema.png", { kind: "diagram" as const, label: null }],
  ["logo.png", { kind: "logo" as const, label: null }],
  ["front.jpg", { kind: "photo" as const, label: null }],
  ["big-unit.jpg", { kind: "photo" as const, label: null }],
]);

describe("deriveMedia", () => {
  it("keeps photos for the gallery, icons and badges as chips, tables and drawings apart", () => {
    const media = deriveMedia(
      ["front.jpg", "icon-wifi.png", "ce.png", "table.png", "unclassified.jpg", "label.jpg", "schema.png", "logo.png"],
      kinds,
    );
    expect(media.photos).toEqual(["front.jpg", "unclassified.jpg"]);
    expect(media.chips.map((chip) => chip.label)).toEqual(["Wi-Fi", "CE"]);
    expect(media.drawings).toEqual(["table.png", "label.jpg", "schema.png"]);
  });

  it("shows one chip per label", () => {
    expect(deriveMedia(["icon-wifi.png", "icon-wifi-2.png"], kinds).chips).toHaveLength(1);
  });

  it("leaves out photos of another model, unless nothing else is left", () => {
    expect(deriveMedia(["front.jpg", "big-unit.jpg"], kinds, new Set(["big-unit.jpg"])).photos).toEqual(["front.jpg"]);
    expect(deriveMedia(["big-unit.jpg", "ce.png"], kinds, new Set(["big-unit.jpg"])).photos).toEqual(["big-unit.jpg"]);
  });

  it("never leaves a gallery empty", () => {
    expect(deriveMedia(["ce.png", "table.png"], kinds).photos).toEqual(["ce.png"]);
    expect(deriveMedia([], kinds).photos).toEqual([]);
  });
});
