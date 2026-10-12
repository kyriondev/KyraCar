// Executes Kyra's tool calls on the client against the local store.

import { formatDecimal, formatNumber, todayIso } from "@/lib/format";
import { fuelStats, sortFuel } from "@/lib/fuel";
import { reminderDetail, reminderStatus } from "@/lib/reminders";
import {
  addFuelEntry,
  addIssue,
  getState,
  selectActiveCar,
  selectFaults,
  selectFuel,
  selectIssues,
  selectReminders,
  setIssueResolved,
} from "@/lib/storage";
import type { ToolName } from "./tool-defs";

/** Card shown in the chat after a write. */
export type ToolAction = { title: string; detail: string };

export type ToolOutcome = {
  result: unknown; // sent back to the model as JSON
  action?: ToolAction;
  source?: string; // read tools: what Kyra looked at, shown next to her answer
};

type Args = Record<string, unknown>;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const round2 = (n: number) => Math.round(n * 100) / 100;

const NO_CAR: ToolOutcome = {
  result: { error: "Uživatel zatím nemá v appce žádné auto. Přidá ho v záložce Garáž." },
};

const handlers: Record<ToolName, (args: Args) => ToolOutcome> = {
  get_car_profile() {
    const car = selectActiveCar(getState());
    if (!car) return NO_CAR;
    return {
      result: {
        name: car.name,
        engine: car.engine ?? null,
        plate: car.plate ?? null,
        odometer_km: car.odometerKm ?? null,
      },
      source: "garáž",
    };
  },

  get_fuel_stats() {
    const s = getState();
    const car = selectActiveCar(s);
    if (!car) return NO_CAR;
    const entries = selectFuel(s, car.id);
    const stats = fuelStats(entries);
    return {
      result: {
        average_l_per_100km:
          stats.averageLitersPer100Km !== undefined ? round2(stats.averageLitersPer100Km) : null,
        full_tank_segments: stats.segmentCount,
        current_month: stats.monthLabel,
        month_total_czk: round2(stats.monthTotalCzk),
        month_fill_ups: stats.monthCount,
        total_fill_ups: entries.length,
        latest: sortFuel(entries)
          .slice(-5)
          .reverse()
          .map((e) => ({
            date: e.date,
            liters: e.liters,
            total_czk: e.totalCzk,
            price_per_liter: e.pricePerLiter,
            odometer_km: e.odometerKm,
            full: e.isFull,
          })),
      },
      source: `deník · ${entries.length} tankování`,
    };
  },

  add_fuel_entry(args) {
    const car = selectActiveCar(getState());
    if (!car) return NO_CAR;
    const liters = num(args.liters);
    const odometerKm = num(args.odometer_km);
    let total = num(args.total_czk);
    let price = num(args.price_per_liter);
    if (!liters || liters <= 0) return { result: { error: "Chybí počet litrů." } };
    if (odometerKm === undefined) return { result: { error: "Chybí stav tachometru." } };
    if (total === undefined && price === undefined) {
      return { result: { error: "Chybí cena: celková nebo za litr." } };
    }
    total ??= round2(liters * price!);
    price ??= round2(total / liters);
    const date = str(args.date)?.match(/^\d{4}-\d{2}-\d{2}$/) ? str(args.date)! : todayIso();
    const entry = addFuelEntry({
      carId: car.id,
      date,
      liters,
      pricePerLiter: price,
      totalCzk: total,
      odometerKm: Math.round(odometerKm),
      isFull: args.is_full !== false,
    });
    return {
      result: { ok: true, id: entry.id },
      action: {
        title: "Zapsáno do deníku",
        detail: `${formatDecimal(liters)} l · ${formatNumber(Math.round(total))} Kč · ${formatDecimal(price, 2)} Kč/l`,
      },
    };
  },

  list_issues(args) {
    const s = getState();
    const car = selectActiveCar(s);
    if (!car) return NO_CAR;
    const status = args.status === "resolved" || args.status === "all" ? args.status : "open";
    const issues = selectIssues(s, car.id).filter((i) => status === "all" || i.status === status);
    return {
      result: issues.map((i) => ({
        id: i.id,
        title: i.title,
        note: i.note ?? null,
        status: i.status,
        created: i.createdAt.slice(0, 10),
        resolved: i.resolvedAt?.slice(0, 10) ?? null,
        odometer_km: i.odometerKm ?? null,
      })),
      source: "problémy",
    };
  },

  add_issue(args) {
    const car = selectActiveCar(getState());
    if (!car) return NO_CAR;
    const title = str(args.title);
    if (!title) return { result: { error: "Chybí název problému." } };
    const issue = addIssue({
      carId: car.id,
      title,
      note: str(args.note),
      odometerKm: car.odometerKm,
      source: "kyra",
    });
    return {
      result: { ok: true, id: issue.id },
      action: { title: "Zapsáno do problémů", detail: title },
    };
  },

  resolve_issue(args) {
    const id = str(args.issue_id);
    const issue = getState().issues.find((i) => i.id === id);
    if (!issue) return { result: { error: "Problém s tímto id neexistuje. Zavolej list_issues." } };
    setIssueResolved(issue.id, true);
    return {
      result: { ok: true },
      action: { title: "Označeno jako vyřešené", detail: issue.title },
    };
  },

  get_reminders() {
    const s = getState();
    const car = selectActiveCar(s);
    if (!car) return NO_CAR;
    return {
      result: selectReminders(s, car.id).map((r) => ({
        label: r.label,
        due_date: r.dueDate ?? null,
        due_km: r.dueKm ?? null,
        note: r.note ?? null,
        status: reminderStatus(r, car.odometerKm).label,
        detail: reminderDetail(r),
      })),
      source: "připomínky",
    };
  },

  get_fault_codes() {
    const s = getState();
    const car = selectActiveCar(s);
    if (!car) return NO_CAR;
    return {
      result: selectFaults(s, car.id).map((f) => ({
        code: f.code,
        title: f.title ?? null,
        severity: f.severity ?? null,
        explanation: f.explanation ?? null,
        checks: f.checks ?? [],
        source: f.source,
        added: f.createdAt.slice(0, 10),
      })),
      source: "chyby z auta",
    };
  },
};

export function runTool(name: string, rawArgs: string): ToolOutcome {
  const handler = handlers[name as ToolName];
  if (!handler) return { result: { error: `Neznámý nástroj ${name}.` } };
  let args: Args = {};
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return { result: { error: "Argumenty nejsou platný JSON." } };
  }
  try {
    return handler(args ?? {});
  } catch (error) {
    console.error("Kyra tool failed:", name, error);
    return { result: { error: "Nástroj selhal." } };
  }
}
