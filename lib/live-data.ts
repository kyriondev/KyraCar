// Live values shown on the Jízda screen. Phase 1 has no car data source;
// phase 2 `ObdSource.readLive()` yields `LiveSample`s in this shape.

export type LiveSample = {
  speedKmh: number | null;
  rpm: number | null;
  coolantC: number | null;
  engineLoadPct: number | null;
  batteryV: number | null;
  intakeAirC: number | null;
};

export const EMPTY_SAMPLE: LiveSample = {
  speedKmh: null,
  rpm: null,
  coolantC: null,
  engineLoadPct: null,
  batteryV: null,
  intakeAirC: null,
};

export type Tone = "muted" | "good" | "warn";

export type Reading = {
  value: number | null;
  caption: string;
  tone: Tone;
};

export const NO_SOURCE_CAPTION = "Bez adaptéru";

function isMissing(value: number | null): value is null {
  return value === null || !Number.isFinite(value);
}

export function describeCoolant(
  value: number | null,
  missingCaption = NO_SOURCE_CAPTION,
): Reading {
  if (isMissing(value)) {
    return { value: null, caption: missingCaption, tone: "muted" };
  }
  if (value < 70) return { value, caption: "Zahřívá se", tone: "muted" };
  if (value <= 105) return { value, caption: "Provozní teplota", tone: "good" };
  return { value, caption: "Vysoká teplota", tone: "warn" };
}

export function describeEngineLoad(
  value: number | null,
  missingCaption = NO_SOURCE_CAPTION,
): Reading {
  if (isMissing(value)) {
    return { value: null, caption: missingCaption, tone: "muted" };
  }
  if (value < 25) return { value, caption: "Nízká zátěž", tone: "muted" };
  if (value < 60) return { value, caption: "Mírná zátěž", tone: "muted" };
  return { value, caption: "Vysoká zátěž", tone: "muted" };
}

/** `engineRunning` decides between judging the alternator and the battery. */
export function describeVoltage(
  value: number | null,
  engineRunning: boolean,
  missingCaption = NO_SOURCE_CAPTION,
): Reading {
  if (isMissing(value)) {
    return { value: null, caption: missingCaption, tone: "muted" };
  }
  if (value > 14.8) return { value, caption: "Přebíjení", tone: "warn" };
  if (engineRunning) {
    return value >= 13.2
      ? { value, caption: "Dobíjení v pořádku", tone: "good" }
      : { value, caption: "Slabé dobíjení", tone: "warn" };
  }
  return value >= 12.4
    ? { value, caption: "Baterie v pořádku", tone: "good" }
    : { value, caption: "Slabá baterie", tone: "warn" };
}

export function describeIntakeAir(
  value: number | null,
  missingCaption = NO_SOURCE_CAPTION,
): Reading {
  if (isMissing(value)) {
    return { value: null, caption: missingCaption, tone: "muted" };
  }
  return { value, caption: "Teplota sání", tone: "muted" };
}
