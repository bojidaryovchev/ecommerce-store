/**
 * The power calculators' arithmetic, kept apart from the forms so it can be tested and read on its
 * own. Every figure is a rule of thumb (the same ones the guides state); the exact sizing is done at
 * the site visit.
 */

export const TOOLS = ["termopompa", "klimatik", "radiatori"] as const;
export type Tool = (typeof TOOLS)[number];
export const isTool = (value: string): value is Tool => (TOOLS as readonly string[]).includes(value);

/** Where each tool's answer can be bought and read about. */
export const TOOL_LINKS: Record<Tool, { category: string; guide: string; installation?: string }> = {
  termopompa: { category: "termopompi", guide: "kakva-termopompa-mi-tryabva", installation: "termopompa" },
  klimatik: { category: "klimatitsi", guide: "kolko-btu-klimatik", installation: "klimatik" },
  radiatori: { category: "radiatori-i-konvektori", guide: "kak-da-izberem-radiator" },
};

/* -- heat pump --------------------------------------------------------------------------------- */

export type Insulation = "new" | "insulated" | "none";
export type Climate = "lowland" | "mountain";

/** Heat loss per m² of heated floor, mid-range of the guide's bands. */
const HEAT_PUMP_W_PER_M2: Record<Insulation, number> = { new: 35, insulated: 60, none: 100 };
/** Colder design temperatures in the mountains (−18 °C rather than −12 °C). */
const CLIMATE_FACTOR: Record<Climate, number> = { lowland: 1, mountain: 1.2 };
/** Domestic hot water, per person. */
const HOT_WATER_KW_PER_PERSON = 0.25;
const HEAT_PUMP_SIZES = [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32];

export function heatPumpPower(input: {
  area: number;
  insulation: Insulation;
  climate: Climate;
  hotWater: boolean;
  people: number;
}) {
  const heating = (input.area * HEAT_PUMP_W_PER_M2[input.insulation] * CLIMATE_FACTOR[input.climate]) / 1000;
  const hotWater = input.hotWater ? input.people * HOT_WATER_KW_PER_PERSON : 0;
  const total = heating + hotWater;
  const recommended = HEAT_PUMP_SIZES.find((size) => size >= total) ?? null;
  return { heating, hotWater, total, recommended };
}

/* -- air conditioner --------------------------------------------------------------------------- */

const KW_TO_BTU = 3412;
const AC_SIZES_BTU = [7000, 9000, 12000, 18000, 24000];

export function airConditionerPower(input: {
  area: number;
  height: number;
  sunny: boolean;
  topFloor: boolean;
  kitchen: boolean;
  people: number;
}) {
  let watts = input.area * 100 * (input.height / 2.6);
  if (input.sunny) watts *= 1.15;
  if (input.topFloor) watts *= 1.15;
  if (input.kitchen) watts *= 1.2;
  watts += Math.max(0, input.people - 2) * 100;
  const btu = (watts / 1000) * KW_TO_BTU;
  // A unit within 5 % of the need is close enough; a larger one cycles and dries the air.
  const recommended = AC_SIZES_BTU.find((size) => size >= btu * 0.95) ?? null;
  return { kw: watts / 1000, btu, recommended };
}

/* -- radiators --------------------------------------------------------------------------------- */

export type RoomInsulation = "good" | "average" | "poor";
export type WaterRegime = "high" | "medium" | "low";

const RADIATOR_W_PER_M2: Record<RoomInsulation, number> = { good: 60, average: 80, poor: 100 };
/** Output relative to the catalogue figure (ΔT 50): (ΔT / 50)^1.3. */
const REGIME_FACTOR: Record<WaterRegime, number> = { high: 1, medium: 0.52, low: 0.35 };
/** Watts per metre of a 600 mm high panel radiator at ΔT 50, roughly. */
export const PANEL_W_PER_METRE = { "11": 1000, "22": 1700, "33": 2400 } as const;

export function radiatorPower(input: {
  area: number;
  height: number;
  insulation: RoomInsulation;
  regime: WaterRegime;
}) {
  const need = input.area * RADIATOR_W_PER_M2[input.insulation] * (input.height / 2.6);
  const rated = need / REGIME_FACTOR[input.regime];
  const lengths = Object.fromEntries(
    Object.entries(PANEL_W_PER_METRE).map(([type, perMetre]) => [
      type,
      Math.ceil(((rated / perMetre) * 1000) / 100) * 100,
    ]),
  ) as Record<keyof typeof PANEL_W_PER_METRE, number>;
  return { need, rated, lengths };
}
