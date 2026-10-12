"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type WakeLockState = {
  supported: boolean;
  /** True while the browser reports a held screen wake lock. */
  active: boolean;
};

const noopSubscribe = () => () => {};

/**
 * Keeps the screen on while the page is visible. The browser drops the lock
 * whenever the page is hidden, so it is re-requested on return. A failed
 * request (some engines want a user gesture, battery saver, policy) is retried
 * on the next tap.
 *
 * iOS: supported since 16.4, but in home-screen (standalone) web apps the lock
 * was silently ineffective until iOS 18.4, even though `active` reads true.
 */
export function useWakeLock(enabled = true): WakeLockState {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "wakeLock" in navigator,
    () => false,
  );
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let requesting = false;
    let disposed = false;

    const acquire = async () => {
      if (disposed || requesting || document.visibilityState !== "visible") {
        return;
      }
      if (sentinel && !sentinel.released) return;
      requesting = true;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) {
          void lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
        lock.addEventListener("release", () => {
          if (!disposed && sentinel === lock) setActive(false);
        });
        setActive(true);
      } catch {
        if (!disposed) setActive(false);
      } finally {
        requesting = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    const onPointerDown = () => void acquire();

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("pointerdown", onPointerDown);
    void acquire();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("pointerdown", onPointerDown);
      if (sentinel && !sentinel.released) void sentinel.release().catch(() => {});
      sentinel = null;
    };
  }, [enabled]);

  return { supported, active: enabled && supported && active };
}
