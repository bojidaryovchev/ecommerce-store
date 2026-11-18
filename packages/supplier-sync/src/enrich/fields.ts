/**
 * What the enrichment pipeline extracts, per kind of product: the typed specification schema.
 *
 * Every field is stored as a product attribute (`attribute` is its slug), so filters, the comparison bars,
 * the spec chips and the structured data read it like any other attribute. Fields that mean the same thing
 * across kinds share one attribute ("Мощност отопление" for a heat pump and a pellet stove alike), so a
 * filter means one thing within a section. Existing supplier attributes keep their slugs (`power-heating`,
 * `axis`, `hight`…): enriched values replace the supplier's on publish.
 *
 * A kind lists the fields that apply to it, with the range a real product's value falls in (outside it, the
 * value is a misreading or a data error and goes to review) and which fields it must have.
 */

export const PRODUCT_KINDS = [
  "heat_pump",
  "air_conditioner",
  "pellet_stove",
  "boiler",
  "radiator",
  "towel_rail",
  "fan_coil",
  "circulation_pump",
  "accessory",
  "other",
] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const ENERGY_CLASSES = ["A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"] as const;

export type FieldType = "number" | "enum" | "text" | "boolean";

export interface SpecField {
  /** Our attribute's slug. */
  attribute: string;
  /** Bulgarian name, as shoppers read it. */
  name: string;
  unit: string | null;
  type: FieldType;
  options?: readonly string[];
  /** Decimals shown; numbers are rounded to this when stored. */
  decimals?: number;
  filterable: boolean;
  sortOrder: number;
  /** For the model: exactly which figure this is. */
  hint: string;
  /** Supplier attributes this field replaces when published (their values are the same figure, badly kept). */
  supersedes?: readonly string[];
}

const number = (
  attribute: string,
  name: string,
  unit: string | null,
  sortOrder: number,
  hint: string,
  extra: Partial<SpecField> = {},
): SpecField => ({ attribute, name, unit, type: "number", decimals: 2, filterable: true, sortOrder, hint, ...extra });

export const SPEC_FIELDS = {
  heatingKw: number(
    "power-heating",
    "Мощност отопление",
    "kW",
    10,
    "Nominal heating output in kW. Heat pumps: heating capacity at A7/W35 (outdoor air 7 °C, water out 35 °C). Stoves and boilers: nominal (total) output.",
  ),
  waterKw: number(
    "water-power",
    "Мощност към водата",
    "kW",
    12,
    "Pellet stoves with a water jacket, and boilers: the part of the output that goes to the water (radiators).",
  ),
  airKw: number(
    "air-power",
    "Мощност към въздуха",
    "kW",
    13,
    "Stoves: the part of the output that heats the room air.",
  ),
  outputW: number(
    "heat-output",
    "Топлинна мощност",
    "W",
    14,
    'Radiators and water towel rails: heat output in W, with the water and room temperatures it was rated at in `condition` ("75/65/20", "90/70/20", "ΔT50"); the shop converts it to ΔT50. Electric towel rails and heating elements: the element\'s power in W, condition null.',
    { decimals: 0, supersedes: ["power-heating"] },
  ),
  heatingBtu: number(
    "power-heating-btu",
    "Мощност отопление (BTU)",
    "BTU/h",
    15,
    "Air conditioners: heating capacity in BTU/h.",
    {
      decimals: 0,
    },
  ),
  coolingKw: number(
    "cooling-power",
    "Мощност охлаждане",
    "kW",
    20,
    "Nominal cooling capacity in kW (heat pumps at A35/W18, air conditioners and fan coils at their rating point).",
  ),
  coolingBtu: number(
    "cooling-power-btu",
    "Мощност охлаждане (BTU)",
    "BTU/h",
    21,
    "Air conditioners: cooling capacity in BTU/h (9000, 12000…).",
    { decimals: 0 },
  ),
  areaM2: number(
    "suitable-for-sq",
    "Подходяща площ",
    "м²",
    30,
    "The floor area the MANUFACTURER or the supplier states it serves, in m² (the upper figure of a range). Never work it out yourself.",
    { decimals: 0 },
  ),
  heatedVolumeM3: number(
    "heated-volume",
    "Отопляем обем",
    "м³",
    31,
    "Stoves and boilers: the room volume the manufacturer states it heats, in m³.",
    { decimals: 0 },
  ),
  scop: number(
    "scop",
    "SCOP",
    null,
    40,
    "Seasonal coefficient of performance for heating, average climate. Heat pumps: the 35 °C (low-temperature) figure; put the water temperature in `condition`.",
  ),
  seer: number("seer", "SEER", null, 41, "Seasonal energy efficiency ratio for cooling."),
  cop: number("cop", "COP", null, 42, "Coefficient of performance at A7/W35 (heat pumps) or the rating point given."),
  eer: number("eer", "EER", null, 43, "Energy efficiency ratio for cooling at the rating point given."),
  energyClassHeating: {
    attribute: "energy-class-heating",
    name: "Енергиен клас (отопление)",
    unit: null,
    type: "enum",
    options: ENERGY_CLASSES,
    filterable: true,
    sortOrder: 44,
    hint: "EU energy label class for space heating. Heat pumps: at 35 °C (low-temperature application).",
  },
  energyClassCooling: {
    attribute: "energy-class-cooling",
    name: "Енергиен клас (охлаждане)",
    unit: null,
    type: "enum",
    options: ENERGY_CLASSES,
    filterable: true,
    sortOrder: 45,
    hint: "EU energy label class for cooling (air conditioners).",
  },
  energyClass: {
    attribute: "energy-class",
    name: "Енергиен клас",
    unit: null,
    type: "enum",
    options: ENERGY_CLASSES,
    filterable: true,
    sortOrder: 46,
    hint: "Stoves and boilers: the EU energy label class.",
  },
  efficiencyPct: number("efficiency", "КПД", "%", 47, "Combustion efficiency at nominal output, in %.", {
    decimals: 1,
  }),
  refrigerant: {
    attribute: "refrigerant",
    name: "Хладилен агент",
    unit: null,
    type: "text",
    filterable: true,
    sortOrder: 50,
    hint: 'The refrigerant, written like "R32", "R290", "R410A".',
  },
  phase: {
    attribute: "power-supply",
    name: "Захранване",
    unit: null,
    type: "enum",
    options: ["Монофазно (230 V)", "Трифазно (400 V)"],
    filterable: true,
    sortOrder: 51,
    hint: "Single-phase (230 V) or three-phase (400 V) supply.",
  },
  soundPowerDb: number(
    "sound-power",
    "Звукова мощност",
    "dB(A)",
    52,
    "A-weighted sound POWER level (LwA) of the outdoor unit, in dB(A).",
    { decimals: 0 },
  ),
  indoorNoiseDb: number(
    "indoor-noise",
    "Шум на вътрешното тяло",
    "dB(A)",
    53,
    "Indoor unit sound PRESSURE level at its lowest fan speed, in dB(A).",
    { decimals: 0 },
  ),
  minOutdoorTempC: number(
    "min-outdoor-temp",
    "Работи до външна температура",
    "°C",
    54,
    "The lowest outdoor temperature it still heats at (e.g. -25).",
    { decimals: 0 },
  ),
  maxFlowTempC: number(
    "max-flow-temp",
    "Максимална температура на водата",
    "°C",
    55,
    "The highest water (flow) temperature it delivers.",
    { decimals: 0 },
  ),
  dhwTankL: number(
    "dhw-tank",
    "Вграден бойлер",
    "л",
    56,
    "Volume of a BUILT-IN domestic hot water tank. Only when it has one.",
    { decimals: 0 },
  ),
  wifi: {
    attribute: "wifi",
    name: "Wi-Fi управление",
    unit: null,
    type: "boolean",
    filterable: true,
    sortOrder: 57,
    hint: "true when it can be controlled over Wi-Fi out of the box (built-in or included module).",
  },
  hopperKg: number("hopper", "Резервоар за пелети", "кг", 60, "Pellet hopper capacity in kg.", { decimals: 0 }),
  burnTimeH: number("burn-time", "Автономия", "ч", 61, "Longest burn on one full hopper (at minimum output), hours.", {
    decimals: 0,
  }),
  fuelUseKgH: number(
    "fuel-use",
    "Разход на гориво",
    "кг/ч",
    62,
    "Fuel (pellet) consumption at nominal output, in kg/h.",
  ),
  flueMm: number("flue-diameter", "Диаметър на димохода", "мм", 63, "Flue (smoke outlet) diameter in mm.", {
    decimals: 0,
  }),
  fuel: {
    attribute: "fuel",
    name: "Гориво",
    unit: null,
    type: "enum",
    options: ["Пелети", "Дърва", "Пелети и дърва", "Твърдо гориво", "Газ", "Нафта", "Газ и нафта", "Електричество"],
    filterable: true,
    sortOrder: 64,
    hint: "What it burns.",
  },
  panelType: {
    attribute: "panel-type",
    name: "Тип на панела",
    unit: null,
    type: "enum",
    options: ["10", "11", "20", "21", "22", "33"],
    filterable: true,
    sortOrder: 70,
    hint: "Steel panel radiators: the panel type (11, 21, 22, 33).",
  },
  sections: number("sections", "Брой секции", null, 71, "Sectional (aluminium) radiators: number of sections.", {
    decimals: 0,
  }),
  connection: {
    attribute: "connection",
    name: "Свързване",
    unit: null,
    type: "enum",
    options: ["Странично", "Долно", "Долно централно"],
    filterable: true,
    sortOrder: 72,
    hint: "Where the water connects: side, bottom, or bottom centre.",
  },
  heightMm: number("hight", "Височина", "мм", 80, "Overall height in mm.", { decimals: 0 }),
  widthMm: number("width", "Ширина", "мм", 81, "Overall width in mm.", { decimals: 0 }),
  lengthMm: number("length", "Дължина", "мм", 82, "Radiators: overall length in mm.", { decimals: 0 }),
  depthMm: number("depth", "Дълбочина", "мм", 83, "Overall depth in mm.", { decimals: 0 }),
  centreDistanceMm: number(
    "axis",
    "Междуосие",
    "мм",
    84,
    "Towel rails and radiators: distance between the centres of the two water connections, in mm.",
    { decimals: 0 },
  ),
  heatingType: {
    attribute: "heating-type",
    name: "Вид",
    unit: null,
    type: "enum",
    options: ["Водна", "Електрическа", "Комбинирана"],
    filterable: true,
    sortOrder: 85,
    hint: "Towel rails: water (on the central heating), electric, or both.",
  },
  colour: {
    attribute: "color",
    name: "Цвят",
    unit: null,
    type: "text",
    filterable: true,
    sortOrder: 86,
    hint: 'Colour or finish in Bulgarian, capitalised ("Бял", "Черен мат", "Хром").',
  },
  airflowM3h: number("airflow", "Въздушен дебит", "м³/ч", 90, "Air flow at the highest fan speed, m³/h.", {
    decimals: 0,
  }),
  maxHeadM: number("max-head", "Максимален напор", "м", 91, "Circulation pumps: maximum head in metres.", {
    decimals: 1,
  }),
  maxFlowM3h: number("max-flow", "Максимален дебит", "м³/ч", 92, "Circulation pumps: maximum flow in m³/h.", {
    decimals: 1,
  }),
  electricPowerW: number(
    "electric-power",
    "Консумирана мощност",
    "W",
    93,
    "Electrical power drawn in normal operation, W (pumps, fans).",
    { decimals: 0 },
  ),
  connectionSize: {
    attribute: "connection-size",
    name: "Присъединяване",
    unit: null,
    type: "text",
    filterable: false,
    sortOrder: 94,
    hint: 'Pipe connection size as stated: 1", 1 1/4", G 1/2.',
  },
  weightKg: number("weight", "Тегло", "кг", 95, "Net weight in kg.", { decimals: 0, filterable: false }),
} as const satisfies Record<string, SpecField>;

export type SpecKey = keyof typeof SPEC_FIELDS;
export const SPEC_KEYS = Object.keys(SPEC_FIELDS) as SpecKey[];

export function isSpecKey(value: string): value is SpecKey {
  return Object.hasOwn(SPEC_FIELDS, value);
}

type Range = readonly [number, number];

export interface KindConfig {
  /** English, for the admin. */
  label: string;
  /** Whether web research is worth it: machines have manufacturer datasheets; towel rails and pipes don't add much. */
  research: boolean;
  /** The fields that apply, with the range a real value falls in. */
  fields: Partial<Record<SpecKey, Range | null>>;
  /** Each inner list needs at least one value. */
  required: readonly (readonly SpecKey[])[];
}

const DIMENSIONS = { heightMm: [100, 2500], widthMm: [100, 2500], depthMm: [20, 1500] } as const;

export const KINDS: Record<ProductKind, KindConfig> = {
  heat_pump: {
    label: "Heat pump",
    research: true,
    fields: {
      heatingKw: [1.5, 60],
      coolingKw: [1, 60],
      scop: [2.5, 7],
      seer: [2.5, 10],
      cop: [1.8, 7.5],
      eer: [1.5, 7],
      energyClassHeating: null,
      energyClassCooling: null,
      refrigerant: null,
      phase: null,
      soundPowerDb: [35, 85],
      minOutdoorTempC: [-40, 5],
      maxFlowTempC: [40, 90],
      dhwTankL: [30, 500],
      wifi: null,
      areaM2: [10, 800],
      ...DIMENSIONS,
      weightKg: [10, 600],
    },
    required: [["heatingKw"]],
  },
  air_conditioner: {
    label: "Air conditioner",
    research: true,
    fields: {
      coolingKw: [1, 25],
      heatingKw: [1, 25],
      coolingBtu: [5000, 80000],
      heatingBtu: [5000, 80000],
      seer: [3, 12],
      scop: [2.5, 6.5],
      eer: [2, 6],
      cop: [2, 6.5],
      energyClassCooling: null,
      energyClassHeating: null,
      refrigerant: null,
      indoorNoiseDb: [12, 60],
      soundPowerDb: [35, 80],
      areaM2: [8, 200],
      wifi: null,
      minOutdoorTempC: [-40, 5],
      phase: null,
      ...DIMENSIONS,
      weightKg: [5, 150],
    },
    required: [["coolingKw", "coolingBtu"]],
  },
  pellet_stove: {
    label: "Pellet stove",
    research: true,
    fields: {
      heatingKw: [2, 45],
      waterKw: [1, 40],
      airKw: [0.5, 25],
      efficiencyPct: [70, 99],
      hopperKg: [5, 120],
      burnTimeH: [3, 120],
      fuelUseKgH: [0.2, 10],
      flueMm: [50, 160],
      heatedVolumeM3: [30, 1500],
      areaM2: [10, 500],
      energyClass: null,
      wifi: null,
      colour: null,
      ...DIMENSIONS,
      weightKg: [20, 500],
      electricPowerW: [10, 600],
    },
    required: [["heatingKw"]],
  },
  boiler: {
    label: "Boiler",
    research: true,
    fields: {
      heatingKw: [3, 2000],
      waterKw: [3, 2000],
      efficiencyPct: [60, 110],
      hopperKg: [10, 5000],
      burnTimeH: [2, 300],
      fuelUseKgH: [0.3, 400],
      flueMm: [60, 600],
      fuel: null,
      areaM2: [20, 20000],
      heatedVolumeM3: [50, 60000],
      energyClass: null,
      wifi: null,
      ...DIMENSIONS,
      heightMm: [300, 4000],
      widthMm: [200, 4000],
      depthMm: [200, 6000],
      weightKg: [20, 20000],
      electricPowerW: [10, 20000],
    },
    required: [["heatingKw"]],
  },
  radiator: {
    label: "Radiator",
    research: false,
    fields: {
      outputW: [40, 8000],
      heightMm: [100, 2500],
      lengthMm: [150, 4000],
      depthMm: [20, 250],
      panelType: null,
      sections: [1, 50],
      connection: null,
      centreDistanceMm: [100, 2500],
      colour: null,
      weightKg: [1, 200],
    },
    required: [["outputW"]],
  },
  towel_rail: {
    label: "Towel rail",
    research: false,
    fields: {
      outputW: [20, 3000],
      heightMm: [250, 2500],
      widthMm: [150, 1500],
      depthMm: [15, 250],
      centreDistanceMm: [150, 1500],
      heatingType: null,
      colour: null,
      weightKg: [1, 80],
    },
    required: [["outputW"]],
  },
  fan_coil: {
    label: "Fan coil",
    research: true,
    fields: {
      heatingKw: [0.2, 60],
      coolingKw: [0.2, 50],
      airflowM3h: [50, 10000],
      indoorNoiseDb: [10, 70],
      electricPowerW: [3, 2000],
      wifi: null,
      colour: null,
      ...DIMENSIONS,
      weightKg: [3, 300],
    },
    required: [["heatingKw", "coolingKw"]],
  },
  circulation_pump: {
    label: "Circulation pump",
    research: true,
    fields: {
      maxHeadM: [0.5, 40],
      maxFlowM3h: [0.2, 100],
      electricPowerW: [2, 5000],
      connectionSize: null,
      heightMm: [50, 1000],
      weightKg: [0.5, 200],
    },
    required: [["maxHeadM", "maxFlowM3h"]],
  },
  accessory: {
    label: "Accessory or part",
    research: false,
    fields: {
      outputW: [10, 5000],
      electricPowerW: [1, 10000],
      connectionSize: null,
      colour: null,
      ...DIMENSIONS,
      heightMm: [5, 3000],
      widthMm: [5, 3000],
      depthMm: [5, 3000],
      weightKg: [0.05, 500],
    },
    required: [],
  },
  other: {
    label: "Other",
    research: false,
    fields: {
      heatingKw: [0.2, 5000],
      outputW: [10, 100000],
      areaM2: [5, 50000],
      electricPowerW: [1, 100000],
      efficiencyPct: [30, 110],
      colour: null,
      ...DIMENSIONS,
      heightMm: [5, 6000],
      widthMm: [5, 6000],
      depthMm: [5, 6000],
      weightKg: [0.05, 50000],
    },
    required: [],
  },
};

/** Which kind of product each of our categories holds (curated tree slugs, see curation.ts). */
export const KIND_BY_CATEGORY: Record<string, ProductKind> = {
  termopompi: "heat_pump",
  monoblok: "heat_pump",
  split: "heat_pump",
  klimatitsi: "air_conditioner",
  "peletni-kamini": "pellet_stove",
  "s-vodna-riza": "pellet_stove",
  suhi: "pellet_stove",
  "za-vgrazhdane": "pellet_stove",
  "s-vazduhovod": "pellet_stove",
  "aksesoari-za-kamini": "accessory",
  kotli: "boiler",
  "peletni-kotli": "boiler",
  "na-tvardo-gorivo": "boiler",
  "na-gaz-i-nafta": "boiler",
  "radiatori-i-konvektori": "radiator",
  "panelni-radiatori": "radiator",
  "aluminievi-radiatori": "radiator",
  "ventilatorni-konvektori": "fan_coil",
  "liri-za-banya": "towel_rail",
  "aluminievi-liri": "towel_rail",
  "dizaynerski-liri": "towel_rail",
  "elektricheski-liri": "towel_rail",
  "stomaneni-liri": "towel_rail",
  "aksesoari-za-liri": "accessory",
  "podovo-otoplenie": "accessory",
  "solarni-sistemi": "other",
  "pompi-i-trabi": "accessory",
  "tsirkulatsionni-pompi": "circulation_pump",
  "trabi-i-fitingi": "accessory",
  "industrialno-otoplenie": "other",
};

export function kindOfCategory(slug: string | null | undefined): ProductKind | null {
  return (slug && KIND_BY_CATEGORY[slug]) || null;
}

/** What the model is told about one field. */
export function fieldBrief(key: SpecKey): {
  key: SpecKey;
  name: string;
  unit: string | null;
  type: FieldType;
  options?: readonly string[];
  hint: string;
} {
  const field: SpecField = SPEC_FIELDS[key];
  return {
    key,
    name: field.name,
    unit: field.unit,
    type: field.type,
    ...(field.options && { options: field.options }),
    hint: field.hint,
  };
}

export function kindFields(kind: ProductKind): SpecKey[] {
  return Object.keys(KINDS[kind].fields) as SpecKey[];
}

/** "5.25" → "5,25": Bulgarian decimals, trailing zeros dropped. */
export function formatNumber(value: number, decimals = 2): string {
  const rounded = Number(value.toFixed(decimals));
  return String(rounded).replace(".", ",");
}

/** A value as the shop shows it: "4,65 kW", "A+++", "Да". */
export function formatSpecValue(key: SpecKey, value: number | string | boolean): string {
  const field: SpecField = SPEC_FIELDS[key];
  if (field.type === "boolean") return value === true ? "Да" : "Не";
  if (field.type === "number" && typeof value === "number") {
    const text = formatNumber(value, field.decimals ?? 2);
    if (!field.unit) return text;
    return field.unit === "%" ? `${text} %` : `${text} ${field.unit}`;
  }
  return String(value);
}

/** Round a number the way it is stored and shown. */
export function roundSpec(key: SpecKey, value: number): number {
  const field: SpecField = SPEC_FIELDS[key];
  return Number(value.toFixed(field.decimals ?? 2));
}
