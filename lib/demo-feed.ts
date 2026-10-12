"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { LiveSample } from "./live-data";

// Development-only fake data. Off unless `?demo=1` is in the URL or the build
// sets NEXT_PUBLIC_KYRA_DEMO=1.
const DEMO_ENV = process.env.NEXT_PUBLIC_KYRA_DEMO === "1";

function subscribeToUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function demoFromUrl() {
  return DEMO_ENV || new URLSearchParams(window.location.search).get("demo") === "1";
}

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribeToUrl, demoFromUrl, () => DEMO_ENV);
}

/** A plausible town-and-country drive; `t` is seconds since start. */
function demoSample(t: number): LiveSample {
  const speed = Math.max(0, 58 + 46 * Math.sin(t / 14) + 7 * Math.sin(t / 3.3));
  const moving = speed >= 3;
  return {
    speedKmh: Math.round(speed),
    rpm: Math.round((moving ? 900 + speed * 30 : 820) + 40 * Math.sin(t * 1.7)),
    coolantC: Math.round(Math.min(90 + Math.sin(t / 9), 52 + t * 0.9)),
    engineLoadPct: Math.round(moving ? 22 + 20 * (1 + Math.sin(t / 5)) : 18),
    batteryV: Math.round((14.05 + 0.12 * Math.sin(t / 7)) * 10) / 10,
    intakeAirC: Math.round(30 + 2 * Math.sin(t / 20)),
  };
}

export function useDemoFeed(enabled: boolean, intervalMs = 1000): LiveSample | null {
  const [sample, setSample] = useState<LiveSample>(() => demoSample(0));

  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const id = window.setInterval(
      () => setSample(demoSample((performance.now() - start) / 1000)),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);

  return enabled ? sample : null;
}
