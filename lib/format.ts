const dateFormat = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});
const numberFormat = new Intl.NumberFormat("cs-CZ");

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" as a local calendar date; a full ISO timestamp is converted to local time. */
export function parseLocalDate(iso: string): Date {
  if (iso.includes("T")) {
    const local = new Date(iso);
    return new Date(local.getFullYear(), local.getMonth(), local.getDate());
  }
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso: string): string {
  return dateFormat.format(parseLocalDate(iso));
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Whole calendar days from today to the date; negative when past. */
export function daysUntil(iso: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((parseLocalDate(iso).getTime() - start.getTime()) / DAY_MS);
}

/** Czech plural: 1 den, 2–4 dny, 5+ dní. */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  if (abs >= 2 && abs <= 4) return few;
  return many;
}

/** Accepts "113 424", "113424 km" and similar; empty input gives undefined. */
export function parseKm(input: string): number | undefined {
  const digits = input.replace(/\D/g, "");
  return digits ? Number(digits) : undefined;
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString("cs-CZ", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** "9. 10." */
export function formatDayMonth(iso: string): string {
  const d = parseLocalDate(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

/** Accepts both "38,4" and "38.4"; empty or invalid input gives undefined. */
export function parseDecimal(input: string): number | undefined {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return undefined;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

/** Today as YYYY-MM-DD in local time. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
