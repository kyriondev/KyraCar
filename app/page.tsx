import Link from "next/link";
import { MicIcon } from "@/components/icons";

export default function DrivePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6">
      <header className="flex h-9 items-center justify-between">
        <h1 className="text-2xl font-bold tracking-[-0.6px]">Kyra</h1>
        <div className="flex h-8 items-center gap-2 rounded-2xl border border-line bg-surface px-3 text-xs font-semibold tracking-[0.4px] text-muted">
          <span className="size-1.5 rounded-full bg-muted" />
          Bez adaptéru
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          role="img"
          aria-label="Rychlost zatím není k dispozici"
          className="block max-h-full"
        >
          <path
            d="M59.5 240.5 A128 128 0 1 1 240.5 240.5"
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <text
            x="150"
            y="176"
            textAnchor="middle"
            fontSize="104"
            fontWeight="200"
            letterSpacing="-3"
            fill="var(--color-muted)"
            className="tabular-nums"
          >
            —
          </text>
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
        </svg>
      </div>

      <Link
        href="/kyra"
        aria-label="Otevřít Kyru"
        className="my-4 flex h-15 items-center gap-3 rounded-[30px] border border-line bg-surface pr-[7px] pl-[22px]"
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
