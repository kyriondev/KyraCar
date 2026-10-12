"use client";

import Link from "next/link";
import { MicIcon } from "@/components/icons";
import { useDemoFeed, useDemoMode } from "@/lib/demo-feed";
import {
  describeCoolant,
  describeEngineLoad,
  describeIntakeAir,
  describeVoltage,
  EMPTY_SAMPLE,
} from "@/lib/live-data";
import { type GpsStatus, useGpsSpeed } from "@/lib/use-gps-speed";
import { useWakeLock } from "@/lib/use-wake-lock";
import { MetricTile } from "./metric-tile";
import { SpeedDial } from "./speed-dial";

const gpsStatusText: Record<GpsStatus, string | null> = {
  off: null,
  pending: "Hledám GPS…",
  active: "GPS aktivní",
  denied: "Poloha zakázána, povol ji v Nastavení",
  unavailable: "GPS bez signálu",
  unsupported: "Poloha není k dispozici",
};

export function DriveScreen() {
  const demo = useDemoMode();
  const demoSample = useDemoFeed(demo);
  const gps = useGpsSpeed(!demo);
  const wakeLock = useWakeLock();

  // Phase 2: car values come from an ObdSource; until then only GPS speed.
  const sample = demoSample ?? { ...EMPTY_SAMPLE, speedKmh: gps.speedKmh };
  const engineRunning = sample.rpm !== null && sample.rpm > 400;

  const status = [
    gpsStatusText[gps.status],
    wakeLock.active ? "Obrazovka svítí" : null,
  ].filter(Boolean);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6">
      <header className="flex h-9 shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold tracking-[-0.6px]">Kyra</h1>
        <div className="flex h-8 items-center gap-2 rounded-2xl border border-line bg-surface px-3 text-xs font-semibold tracking-[0.4px] text-muted">
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${demo ? "bg-gold" : "bg-muted"}`}
          />
          {demo ? "Ukázková data" : "Bez adaptéru"}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <SpeedDial speedKmh={sample.speedKmh} rpm={sample.rpm} />
        <p
          aria-live="polite"
          className="-mt-5 min-h-4 shrink-0 text-center text-xs leading-4 font-medium text-muted"
        >
          {status.join(" · ")}
        </p>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3">
        <MetricTile
          label="Chladicí kapalina"
          unit="°C"
          reading={describeCoolant(sample.coolantC)}
        />
        <MetricTile
          label="Zátěž motoru"
          unit="%"
          reading={describeEngineLoad(sample.engineLoadPct)}
        />
        <MetricTile
          label="Napětí"
          unit="V"
          decimals={1}
          reading={describeVoltage(sample.batteryV, engineRunning)}
        />
        <MetricTile
          label="Nasávaný vzduch"
          unit="°C"
          reading={describeIntakeAir(sample.intakeAirC)}
        />
      </div>

      <Link
        href="/kyra"
        aria-label="Otevřít Kyru"
        className="my-4 flex h-15 shrink-0 items-center gap-3 rounded-[30px] border border-line bg-surface pr-[7px] pl-[22px]"
      >
        <span className="flex-1 font-serif text-[22px] font-medium text-muted">
          Zeptej se Kyry…
        </span>
        <span className="flex size-[46px] items-center justify-center rounded-full bg-gold text-bg">
          <MicIcon size={22} strokeWidth={1.8} />
        </span>
      </Link>
    </div>
  );
}
