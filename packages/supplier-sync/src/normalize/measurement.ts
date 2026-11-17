export type Measurement = { value: number; unit: string | null };

/**
 * Parses attribute values such as "13000 BTU/h", "10,1 kW", "12 000", "50мм" or "до 85 кв.".
 * Returns null for anything that is not a single number with an optional unit
 * (ranges like "от 60 до 80 кв.м.", sizes like "36/50" or "500x1200").
 */
export function parseMeasurement(text: string): Measurement | null {
  const match = /^(?:до\s+|up to\s+)?(-?\d{1,3}(?:[ \u00a0]\d{3})+|-?\d+)(?:[.,](\d+))?\s*([^\d\s][^\d]*)?$/iu.exec(
    text.trim(),
  );
  if (!match) return null;
  const whole = (match[1] ?? "").replace(/[ \u00a0]/g, "");
  const value = Number(match[2] ? `${whole}.${match[2]}` : whole);
  if (!Number.isFinite(value)) return null;
  const unit = match[3]?.trim() || null;
  if (unit !== null && unit.length > 16) return null;
  return { value, unit };
}

/**
 * Brings a value into the unit its attribute is named after, where the supplier mixed units:
 * "700 W" under "мощност отопление kW" becomes 0.7 kW.
 */
export function toAttributeUnit(attributeName: string, measurement: Measurement): Measurement {
  const wantsKw = /(?<!\p{L})(?:kw|квт)(?!\p{L})/iu.test(attributeName);
  if (wantsKw && measurement.unit !== null && /^(?:w|вт)$/iu.test(measurement.unit)) {
    return { value: Math.round((measurement.value / 1000) * 1000) / 1000, unit: "kW" };
  }
  return measurement;
}
