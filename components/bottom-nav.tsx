"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { BookIcon, CarIcon, GaugeIcon, MicIcon, PulseIcon } from "./icons";

type Tab = {
  href: string;
  label: string;
  icon: ComponentType;
};

const tabs: Tab[] = [
  { href: "/", label: "Jízda", icon: GaugeIcon },
  { href: "/kyra", label: "Kyra", icon: MicIcon },
  { href: "/servis", label: "Servis", icon: PulseIcon },
  { href: "/denik", label: "Deník", icon: BookIcon },
  { href: "/garaz", label: "Garáž", icon: CarIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hlavní navigace"
      className="flex shrink-0 items-start border-t border-line bg-bg px-2 pt-1.5 pb-safe-nav"
    >
      {tabs.map(({ href, label, icon: TabIcon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center gap-1 text-[11px] font-semibold tracking-[0.3px] ${
              active ? "text-gold" : "text-muted"
            }`}
          >
            <span
              className={`h-0.5 w-4 rounded-[1px] ${active ? "bg-gold" : "bg-transparent"}`}
            />
            <TabIcon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
