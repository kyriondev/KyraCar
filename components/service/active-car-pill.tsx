"use client";

import Link from "next/link";
import { useActiveCar } from "@/lib/use-store";

export function ActiveCarPill() {
  const car = useActiveCar();
  if (!car) return null;
  return (
    <Link
      href="/garaz"
      aria-label={`Aktivní auto ${car.name}, změnit v Garáži`}
      className="flex h-8 max-w-[45%] items-center truncate rounded-2xl border border-line bg-surface px-3 text-xs font-semibold tracking-[0.4px] text-muted"
    >
      {car.name}
    </Link>
  );
}
