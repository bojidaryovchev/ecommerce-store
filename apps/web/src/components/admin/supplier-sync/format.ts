import { formatCurrency } from "@/lib/utils";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Sofia",
});

export function formatDateTime(date: Date | string | null | undefined): string {
  return date ? dateTime.format(new Date(date)) : "—";
}

export function formatDuration(start: Date | string, end: Date | string | null): string {
  if (!end) return "—";
  const seconds = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  return seconds < 90 ? `${seconds}s` : `${Math.round(seconds / 60)} min`;
}

export function formatAmount(value: unknown, currency = "eur"): string {
  return typeof value === "number" ? formatCurrency(value, currency.toUpperCase()) : "price on request";
}

/** Renders a stored before/after value (string, number, list or object) as short text. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}
