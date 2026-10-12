import { parseLocalDate } from "./format";
import type { FuelEntry } from "./types";

export type ConsumptionPoint = {
  entryId: string;
  date: string;
  litersPer100Km: number;
};

export type FuelStats = {
  /** Average l/100 km over all full-to-full segments, if there are any. */
  averageLitersPer100Km?: number;
  segmentCount: number;
  /** Per full tank, oldest first. */
  points: ConsumptionPoint[];
  monthTotalCzk: number;
  monthCount: number;
  monthLabel: string; // "Říjen"
};

const MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

/** Oldest first; odometer decides, date breaks ties. */
export function sortFuel(entries: FuelEntry[]): FuelEntry[] {
  return [...entries].sort(
    (a, b) => a.odometerKm - b.odometerKm || a.date.localeCompare(b.date),
  );
}

/**
 * l/100 km for each full tank: liters filled since the previous full tank
 * (including partial fills in between) over the distance driven.
 */
export function consumptionPoints(entries: FuelEntry[]): ConsumptionPoint[] {
  const sorted = sortFuel(entries);
  const points: ConsumptionPoint[] = [];
  let lastFull: FuelEntry | undefined;
  let liters = 0;

  for (const entry of sorted) {
    if (!lastFull) {
      if (entry.isFull) lastFull = entry;
      continue;
    }
    liters += entry.liters;
    if (!entry.isFull) continue;
    const km = entry.odometerKm - lastFull.odometerKm;
    if (km > 0) {
      points.push({ entryId: entry.id, date: entry.date, litersPer100Km: (liters / km) * 100 });
    }
    lastFull = entry;
    liters = 0;
  }
  return points;
}

export function fuelStats(entries: FuelEntry[], now = new Date()): FuelStats {
  const points = consumptionPoints(entries);

  // Weighted average over the whole span between the first and the last full tank.
  const sorted = sortFuel(entries);
  const fulls = sorted.filter((e) => e.isFull);
  let averageLitersPer100Km: number | undefined;
  if (points.length > 0) {
    const first = fulls[0];
    const last = fulls[fulls.length - 1];
    const liters = sorted
      .filter((e) => e.odometerKm > first.odometerKm && e.odometerKm <= last.odometerKm)
      .reduce((sum, e) => sum + e.liters, 0);
    averageLitersPer100Km = (liters / (last.odometerKm - first.odometerKm)) * 100;
  }

  const inMonth = entries.filter((e) => {
    const d = parseLocalDate(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  return {
    averageLitersPer100Km,
    segmentCount: points.length,
    points,
    monthTotalCzk: inMonth.reduce((sum, e) => sum + e.totalCzk, 0),
    monthCount: inMonth.length,
    monthLabel: MONTHS[now.getMonth()],
  };
}
