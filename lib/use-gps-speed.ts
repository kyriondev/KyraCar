"use client";

import { useEffect, useState } from "react";

export type GpsStatus =
  | "off" // not requested (e.g. demo mode)
  | "pending" // waiting for permission or the first fix
  | "active"
  | "denied"
  | "unavailable" // no signal / position error, the watch keeps trying
  | "unsupported";

export type GpsSpeed = {
  status: GpsStatus;
  /** Whole km/h, null when the device doesn't report speed. */
  speedKmh: number | null;
};

// iOS may stop sending fixes while standing still; an old speed would lie.
const STALE_AFTER_MS = 10_000;

/** Ground speed from `navigator.geolocation.watchPosition`. */
export function useGpsSpeed(enabled = true): GpsSpeed {
  const [state, setState] = useState<GpsSpeed>({
    status: "pending",
    speedKmh: null,
  });

  useEffect(() => {
    if (!enabled) return;
    if (!("geolocation" in navigator)) {
      // Deferred so the effect doesn't set state synchronously.
      const id = window.setTimeout(() =>
        setState({ status: "unsupported", speedKmh: null }),
      );
      return () => window.clearTimeout(id);
    }

    let staleTimer: number | undefined;
    const markStale = () => {
      window.clearTimeout(staleTimer);
      staleTimer = window.setTimeout(
        () => setState((prev) => ({ ...prev, speedKmh: null })),
        STALE_AFTER_MS,
      );
    };

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const mps = coords.speed;
        // Speed is null (or NaN/negative on some engines) without a usable fix.
        const valid = mps !== null && Number.isFinite(mps) && mps >= 0;
        setState({
          status: "active",
          speedKmh: valid ? Math.round(mps * 3.6) : null,
        });
        markStale();
      },
      (error) => {
        // Only PERMISSION_DENIED ends the watch; other errors are transient.
        setState({
          status:
            error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
          speedKmh: null,
        });
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(staleTimer);
    };
  }, [enabled]);

  return enabled ? state : { status: "off", speedKmh: null };
}
