"use client";

import { useState } from "react";
import {
  ChevronRightIcon,
  PencilIcon,
  PhoneIcon,
  PlugIcon,
} from "@/components/icons";
import { EmptyCard, PageBody, PageHeader, SectionLabel } from "@/components/page";
import { formatNumber } from "@/lib/format";
import { reminderDetail, reminderStatus, type ReminderTone } from "@/lib/reminders";
import { selectActiveCar, selectReminders, setActiveCar } from "@/lib/storage";
import type { Car } from "@/lib/types";
import { useStore } from "@/lib/use-store";
import { CarSheet } from "./car-sheet";
import { ReminderSheet, type ReminderTarget } from "./reminder-sheet";

export function GarageScreen() {
  const state = useStore();
  const car = selectActiveCar(state);
  const [carSheet, setCarSheet] = useState<"new" | "edit" | null>(null);
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);

  return (
    <>
      <PageHeader title="Garáž">
        {state.ready && (
          <div className="noscroll mt-2 -mr-6 flex gap-2 overflow-x-auto pr-6">
            {state.cars.map((c) => {
              const active = c.id === car?.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCar(c.id)}
                  className={`h-11 shrink-0 rounded-full border px-4 text-[13px] whitespace-nowrap ${
                    active
                      ? "border-gold font-bold text-gold"
                      : "border-line font-semibold text-muted"
                  }`}
                >
                  {[c.name, c.plate].filter(Boolean).join(" · ")}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCarSheet("new")}
              className="h-11 shrink-0 rounded-full border border-dashed border-line-dashed px-4 text-[13px] font-semibold whitespace-nowrap text-muted"
            >
              + Přidat auto
            </button>
          </div>
        )}
      </PageHeader>

      <PageBody>
        {state.ready && !car && (
          <EmptyCard
            title="Zatím žádné auto"
            text="Přidej auto a Kyra mu bude hlídat pojištění, STK, dálniční známku a olej."
          />
        )}

        {car && (
          <>
            <CarCard car={car} onEdit={() => setCarSheet("edit")} />

            <SectionLabel>Připomínky</SectionLabel>
            <div className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface">
              {selectReminders(state, car.id).map((reminder) => {
                const status = reminderStatus(reminder, car.odometerKm);
                return (
                  <button
                    key={reminder.id}
                    type="button"
                    onClick={() => setReminderTarget(reminder)}
                    className="flex min-h-16 items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-left first:border-t-0"
                  >
                    <span className="flex min-w-0 flex-col gap-[3px]">
                      <span className="text-[15px] font-semibold">{reminder.label}</span>
                      <span className="text-[13px] font-medium text-muted">
                        {reminderDetail(reminder)}
                      </span>
                    </span>
                    <ToneBadge tone={status.tone}>{status.label}</ToneBadge>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setReminderTarget({ carId: car.id })}
                className="flex min-h-14 items-center border-t border-line px-4 text-left text-[14px] font-semibold text-gold"
              >
                + Přidat připomínku
              </button>
            </div>

            <SectionLabel>Adaptér</SectionLabel>
            <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-4">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-muted">
                  <PlugIcon size={22} strokeWidth={1.7} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-[15px] font-semibold">OBD adaptér</span>
                  <span className="text-[13px] font-medium text-muted">Nespárováno · K-line</span>
                </span>
              </div>
              <p className="text-xs leading-normal font-medium text-muted">
                Čtení dat z auta přes K-line přijde v další fázi. Do té doby appka funguje bez
                adaptéru.
              </p>
            </div>
          </>
        )}

        {state.ready && (
          <a
            href="tel:1224"
            aria-label="Zavolat na linku pomoci řidičům 1224"
            className="mt-1.5 flex min-h-16 items-center gap-3.5 rounded-[20px] border border-line bg-surface px-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warn-bg text-warn">
              <PhoneIcon size={20} strokeWidth={1.8} />
            </span>
            <span className="flex flex-1 flex-col gap-[3px]">
              <span className="text-[15px] font-semibold">Pomoc na silnici</span>
              <span className="text-[13px] font-medium text-muted">Linka pomoci řidičům 1224</span>
            </span>
            <ChevronRightIcon size={16} strokeWidth={2} className="text-muted" />
          </a>
        )}
      </PageBody>

      <CarSheet
        open={carSheet !== null}
        car={carSheet === "edit" ? car : undefined}
        onClose={() => setCarSheet(null)}
      />
      <ReminderSheet target={reminderTarget} onClose={() => setReminderTarget(null)} />
    </>
  );
}

function CarCard({ car, onEdit }: { car: Car; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Upravit auto ${car.name}`}
      className="relative flex flex-col gap-[18px] rounded-3xl border border-line bg-surface p-5 text-left"
    >
      <PencilIcon size={20} className="absolute top-5 right-5 text-muted" />
      <span className="flex flex-col gap-1 pr-8">
        <span className="font-serif text-[38px] leading-[1.05] font-medium">{car.name}</span>
        {car.engine && (
          <span className="text-[13px] font-medium text-muted">{car.engine}</span>
        )}
      </span>
      {car.plate ? (
        <Plate plate={car.plate} />
      ) : (
        <span className="flex h-11 items-center self-start rounded-full border border-dashed border-line-dashed px-4 text-xs font-bold text-gold">
          doplnit SPZ
        </span>
      )}
      <span className="flex items-baseline justify-between border-t border-line pt-3.5">
        <span className="text-[11px] font-semibold tracking-[2.4px] text-muted">TACHOMETR</span>
        <span className="text-[22px] font-light tabular-nums">
          {car.odometerKm !== undefined ? formatNumber(car.odometerKm) : "—"}
          <span className="ml-1.5 text-[13px] font-medium text-muted">km</span>
        </span>
      </span>
    </button>
  );
}

function Plate({ plate }: { plate: string }) {
  return (
    <span className="flex h-[52px] self-start overflow-hidden rounded-lg bg-plate">
      <span className="flex w-[30px] items-center justify-center bg-plate-eu text-[10px] font-bold text-white">
        CZ
      </span>
      <span className="flex items-center px-[18px] text-[26px] font-bold tracking-[3px] text-plate-ink">
        {plate}
      </span>
    </span>
  );
}

const TONE_STYLES: Record<ReminderTone, string> = {
  empty: "border-dashed border-line-dashed text-gold",
  ok: "border-kyra-line bg-kyra-bg text-green",
  soon: "border-line-gold bg-surface-active text-gold",
  overdue: "border-warn/40 bg-warn-bg text-warn",
};

function ToneBadge({ tone, children }: { tone: ReminderTone; children: string }) {
  return (
    <span
      className={`flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-bold whitespace-nowrap tabular-nums ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
