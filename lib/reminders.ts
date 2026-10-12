import { daysUntil, formatDate, formatNumber, plural } from "./format";
import type { Reminder, ReminderKind } from "./types";

type KindInfo = {
  label: string;
  hint: string; // shown while the reminder has no data
  dateLabel: string;
  datePrefix: string;
  tracksKm: boolean;
  notePlaceholder: string;
};

export const REMINDER_KINDS: Record<ReminderKind, KindInfo> = {
  insurance: {
    label: "Pojištění",
    hint: "konec pojištění",
    dateLabel: "Pojištění platí do",
    datePrefix: "platí do",
    tracksKm: false,
    notePlaceholder: "Pojišťovna",
  },
  inspection: {
    label: "STK",
    hint: "datum je v techničáku",
    dateLabel: "STK platí do",
    datePrefix: "platí do",
    tracksKm: false,
    notePlaceholder: "Poznámka",
  },
  vignette: {
    label: "Dálniční známka",
    hint: "platnost",
    dateLabel: "Známka platí do",
    datePrefix: "platí do",
    tracksKm: false,
    notePlaceholder: "Poznámka",
  },
  oil: {
    label: "Výměna oleje",
    hint: "datum a stav km",
    dateLabel: "Příští výměna nejpozději",
    datePrefix: "do",
    tracksKm: true,
    notePlaceholder: "Olej, např. 5W-40",
  },
  custom: {
    label: "Připomínka",
    hint: "termín nebo stav km",
    dateLabel: "Termín",
    datePrefix: "do",
    tracksKm: true,
    notePlaceholder: "Poznámka",
  },
};

const DEFAULT_KINDS: ReminderKind[] = ["insurance", "inspection", "vignette", "oil"];

export function defaultReminders(carId: string): Reminder[] {
  return DEFAULT_KINDS.map((kind) => ({
    id: crypto.randomUUID(),
    carId,
    kind,
    label: REMINDER_KINDS[kind].label,
  }));
}

export type ReminderTone = "empty" | "ok" | "soon" | "overdue";

export type ReminderStatus = { tone: ReminderTone; label: string };

const SOON_DAYS = 30;
const SOON_KM = 1000;
const TONE_RANK: Record<ReminderTone, number> = { empty: 0, ok: 1, soon: 2, overdue: 3 };

function dateStatus(dueDate: string, today: Date): ReminderStatus {
  const days = daysUntil(dueDate, today);
  if (days < 0) {
    const n = -days;
    return { tone: "overdue", label: `${n} ${plural(n, "den", "dny", "dní")} po termínu` };
  }
  if (days === 0) return { tone: "overdue", label: "dnes" };
  return {
    tone: days <= SOON_DAYS ? "soon" : "ok",
    label: `za ${formatNumber(days)} ${plural(days, "den", "dny", "dní")}`,
  };
}

function kmStatus(dueKm: number, odometerKm: number): ReminderStatus {
  const left = dueKm - odometerKm;
  if (left <= 0) return { tone: "overdue", label: `přejeto o ${formatNumber(-left)} km` };
  return { tone: left <= SOON_KM ? "soon" : "ok", label: `za ${formatNumber(left)} km` };
}

/** The more urgent of the date and km conditions. */
export function reminderStatus(
  reminder: Reminder,
  odometerKm: number | undefined,
  today = new Date(),
): ReminderStatus {
  const candidates: ReminderStatus[] = [];
  if (reminder.dueDate) candidates.push(dateStatus(reminder.dueDate, today));
  if (reminder.dueKm !== undefined && odometerKm !== undefined) {
    candidates.push(kmStatus(reminder.dueKm, odometerKm));
  }
  if (candidates.length === 0) {
    return reminder.dueKm !== undefined
      ? { tone: "ok", label: `při ${formatNumber(reminder.dueKm)} km` }
      : { tone: "empty", label: "doplnit" };
  }
  return candidates.reduce((a, b) => (TONE_RANK[b.tone] > TONE_RANK[a.tone] ? b : a));
}

export function reminderDetail(reminder: Reminder): string {
  const info = REMINDER_KINDS[reminder.kind];
  const parts = [
    reminder.note,
    reminder.dueDate && `${info.datePrefix} ${formatDate(reminder.dueDate)}`,
    reminder.dueKm !== undefined && `při ${formatNumber(reminder.dueKm)} km`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : info.hint;
}
