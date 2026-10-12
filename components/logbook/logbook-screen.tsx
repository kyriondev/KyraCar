"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { EmptyCard, PageBody, PageHeader, SectionLabel } from "@/components/page";
import { consumptionPoints, fuelStats, sortFuel, type ConsumptionPoint } from "@/lib/fuel";
import { formatDayMonth, formatDecimal, formatNumber } from "@/lib/format";
import { reminderStatus } from "@/lib/reminders";
import { selectActiveCar, selectFuel, selectReminders } from "@/lib/storage";
import { useStore } from "@/lib/use-store";
import { FuelSheet, type FuelTarget } from "./fuel-sheet";

const CHART_BARS = 6;
const CHART_HEIGHT = 88;

export function LogbookScreen() {
  const state = useStore();
  const car = selectActiveCar(state);
  const [fuelTarget, setFuelTarget] = useState<FuelTarget | null>(null);

  const entries = useMemo(
    () => (car ? sortFuel(selectFuel(state, car.id)).reverse() : []),
    [state, car],
  );
  // Only on the client: fuelStats reads the current date.
  const stats = useMemo(() => (car ? fuelStats(entries) : undefined), [car, entries]);
  const pointByEntry = useMemo(
    () => new Map(consumptionPoints(entries).map((p) => [p.entryId, p])),
    [entries],
  );
  const oil = car && selectReminders(state, car.id).find((r) => r.kind === "oil");

  return (
    <>
      <PageHeader
        title="Deník"
        action={
          car && (
            <button
              type="button"
              aria-label="Přidat tankování"
              onClick={() => setFuelTarget({ car })}
              className="flex size-11 items-center justify-center rounded-full bg-gold text-bg"
            >
              <PlusIcon size={22} strokeWidth={2} />
            </button>
          )
        }
      />

      <PageBody>
        {state.ready && !car && (
          <Link href="/garaz" className="block">
            <EmptyCard
              title="Nejdřív přidej auto"
              text="Deník se vede pro každé auto zvlášť. Auto přidáš v Garáži."
            />
          </Link>
        )}

        {car && stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Spotřeba"
                value={
                  stats.averageLitersPer100Km !== undefined
                    ? formatDecimal(stats.averageLitersPer100Km)
                    : "—"
                }
                unit="l/100 km"
                caption={
                  stats.segmentCount > 0
                    ? `průměr ${[2, 3, 4, 7].includes(stats.segmentCount) ? "ze" : "z"} ${stats.segmentCount} tankování`
                    : "chybí 2 tankování do plna"
                }
              />
              <StatTile
                label={stats.monthLabel}
                value={formatNumber(Math.round(stats.monthTotalCzk))}
                unit="Kč"
                caption={`${stats.monthCount} tankování`}
              />
            </div>

            {stats.points.length > 0 && <ConsumptionChart points={stats.points.slice(-CHART_BARS)} />}

            <SectionLabel>Tankování</SectionLabel>
            {entries.length === 0 ? (
              <EmptyCard
                title="Zatím žádné tankování"
                text="Přidej ho tlačítkem plus. Stačí litry, cena a stav tachometru."
              />
            ) : (
              <div className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface">
                {entries.map((entry) => {
                  const point = pointByEntry.get(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setFuelTarget(entry)}
                      className="flex min-h-[68px] items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-left first:border-t-0"
                    >
                      <span className="flex flex-col gap-[3px]">
                        <span className="text-[15px] font-semibold">
                          {formatDayMonth(entry.date)}
                          {!entry.isFull && (
                            <span className="ml-2 text-xs font-medium text-muted">částečně</span>
                          )}
                        </span>
                        <span className="text-[13px] font-medium text-muted tabular-nums">
                          {formatDecimal(entry.liters)} l · {formatDecimal(entry.pricePerLiter, 2)} Kč/l
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-[3px]">
                        <span className="text-base font-semibold tabular-nums">
                          {formatNumber(Math.round(entry.totalCzk))} Kč
                        </span>
                        <span className="text-xs font-medium text-muted tabular-nums">
                          {formatNumber(entry.odometerKm)} km
                          {point && ` · ${formatDecimal(point.litersPer100Km)} l/100 km`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <SectionLabel>Údržba</SectionLabel>
            <Link
              href="/garaz"
              className="flex min-h-14 items-center justify-between rounded-[20px] border border-line bg-surface px-4"
            >
              <span className="text-[15px] font-medium">Výměna oleje</span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-gold">
                {oil ? reminderStatus(oil, car.odometerKm).label : "doplnit"}
                <ChevronRightIcon size={16} strokeWidth={2} />
              </span>
            </Link>

            <p className="mt-2 px-1 font-serif text-xl leading-[1.3] font-medium text-muted">
              Řekni Kyře „zapiš tankování“ a doplní se to samo.
            </p>
          </>
        )}
      </PageBody>

      <FuelSheet target={fuelTarget} onClose={() => setFuelTarget(null)} />
    </>
  );
}

function StatTile({
  label,
  value,
  unit,
  caption,
}: {
  label: string;
  value: string;
  unit: string;
  caption: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[20px] border border-line bg-surface p-4">
      <span className="text-[11px] font-semibold tracking-[1.6px] text-muted uppercase">{label}</span>
      <span className="text-4xl leading-[1.1] font-light tabular-nums">
        {value}
        <span className="ml-1.5 text-[13px] font-medium text-muted">{unit}</span>
      </span>
      <span className="text-xs font-medium text-muted">{caption}</span>
    </div>
  );
}

function ConsumptionChart({ points }: { points: ConsumptionPoint[] }) {
  const max = Math.max(...points.map((p) => p.litersPer100Km));
  const latest = points.length - 1;
  return (
    <figure className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-4">
      <figcaption className="text-[11px] font-semibold tracking-[2.4px] text-muted">
        SPOTŘEBA PODLE TANKOVÁNÍ{" "}
        <span className="font-medium tracking-[0.4px]">· l/100 km</span>
      </figcaption>
      <ol className="flex h-32 items-end justify-around">
        {points.map((p, i) => (
          <li
            key={p.entryId}
            className="flex flex-col items-center gap-1.5"
            aria-label={`${formatDayMonth(p.date)}: ${formatDecimal(p.litersPer100Km)} litru na 100 km`}
          >
            <span
              className={`text-sm font-semibold tabular-nums ${i === latest ? "text-gold" : ""}`}
            >
              {formatDecimal(p.litersPer100Km)}
            </span>
            <span
              className={`w-11 rounded-[10px] ${i === latest ? "bg-gold" : "bg-chart-muted"}`}
              style={{ height: Math.max(8, (p.litersPer100Km / max) * CHART_HEIGHT) }}
            />
          </li>
        ))}
      </ol>
      <div className="flex justify-around text-xs font-medium text-muted" aria-hidden="true">
        {points.map((p) => (
          <span key={p.entryId} className="w-11 text-center tabular-nums">
            {formatDayMonth(p.date)}
          </span>
        ))}
      </div>
    </figure>
  );
}
