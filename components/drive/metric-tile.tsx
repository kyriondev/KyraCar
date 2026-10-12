import type { Reading, Tone } from "@/lib/live-data";

const toneClass: Record<Tone, string> = {
  muted: "text-muted",
  good: "text-green",
  warn: "text-warn",
};

const formats = new Map<number, Intl.NumberFormat>();

function formatValue(value: number, decimals: number) {
  let format = formats.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat("cs-CZ", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formats.set(decimals, format);
  }
  return format.format(value);
}

export function MetricTile({
  label,
  unit,
  reading,
  decimals = 0,
}: {
  label: string;
  unit: string;
  reading: Reading;
  decimals?: number;
}) {
  const { value, caption, tone } = reading;

  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[20px] border border-line bg-surface px-4 py-3.5">
      {/* "CHLADICÍ KAPALINA" is a touch wider than the content box at 390 px;
          like the design, let it run into the right padding before clipping. */}
      <div className="-mr-3 truncate text-[11px] font-semibold tracking-label text-muted uppercase">
        {label}
      </div>
      <div className="text-[30px] leading-[1.1] font-light tabular-nums">
        {value === null ? (
          <>
            <span aria-hidden="true" className="text-muted">
              —
            </span>
            <span className="sr-only">bez hodnoty</span>
          </>
        ) : (
          formatValue(value, decimals)
        )}
        <span
          aria-hidden={value === null ? true : undefined}
          className="ml-[3px] text-base text-muted"
        >
          {unit}
        </span>
      </div>
      <div className={`truncate text-xs font-medium ${toneClass[tone]}`}>
        {caption}
      </div>
    </div>
  );
}
