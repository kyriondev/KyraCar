import { formatNumber, plural } from "@/lib/format";

const MAX_SPEED_KMH = 180;

// 270° arc, r = 128, centred at (150, 150), gap at the bottom.
const ARC = "M59.5 240.5 A128 128 0 1 1 240.5 240.5";
// Real length instead of `pathLength`, which older WebKit handles poorly.
const ARC_LENGTH = 128 * 1.5 * Math.PI;

function describe(speedKmh: number | null, rpm: number | null) {
  const speed =
    speedKmh === null
      ? "Rychlost není k dispozici"
      : `Rychlost ${formatNumber(speedKmh)} ${plural(speedKmh, "kilometr", "kilometry", "kilometrů")} za hodinu`;
  const revs =
    rpm === null
      ? "otáčky nejsou k dispozici"
      : `otáčky ${formatNumber(rpm)} za minutu`;
  return `${speed}, ${revs}`;
}

export function SpeedDial({
  speedKmh,
  rpm,
}: {
  speedKmh: number | null;
  rpm: number | null;
}) {
  const fraction =
    speedKmh === null ? 0 : Math.min(Math.max(speedKmh, 0), MAX_SPEED_KMH) / MAX_SPEED_KMH;

  return (
    <svg
      width="300"
      height="300"
      viewBox="0 0 300 300"
      role="img"
      aria-label={describe(speedKmh, rpm)}
      className="block max-h-full min-h-0 shrink"
    >
      <path
        d={ARC}
        fill="none"
        stroke="var(--color-surface-2)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d={ARC}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
        strokeDashoffset={ARC_LENGTH * (1 - fraction)}
        opacity={fraction > 0 ? 1 : 0}
        className="transition-[stroke-dashoffset,opacity] duration-700 ease-out motion-reduce:transition-none"
      />

      {speedKmh === null ? (
        <text
          x="150"
          y="176"
          textAnchor="middle"
          fontSize="104"
          fontWeight="200"
          fill="var(--color-muted)"
        >
          —
        </text>
      ) : (
        <text
          x="150"
          y="176"
          textAnchor="middle"
          fontSize="104"
          fontWeight="600"
          letterSpacing="-3"
          fill="var(--color-ink-strong)"
          className="tabular-nums"
        >
          {speedKmh}
        </text>
      )}
      <text
        x="150"
        y="204"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        letterSpacing="3"
        fill="var(--color-gold)"
      >
        km/h
      </text>
      <text x="150" y="260" textAnchor="middle" className="tabular-nums">
        <tspan
          fontSize="22"
          fontWeight="300"
          fill={rpm === null ? "var(--color-muted)" : "var(--color-ink)"}
        >
          {rpm === null ? "—" : formatNumber(rpm)}
        </tspan>
        <tspan dx="6" fontSize="12" fontWeight="600" fill="var(--color-muted)">
          ot/min
        </tspan>
      </text>
    </svg>
  );
}
