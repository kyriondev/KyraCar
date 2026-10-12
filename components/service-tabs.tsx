"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/servis", label: "Chyby z auta" },
  { href: "/servis/problemy", label: "Moje problémy" },
];

export function ServiceTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Části servisu"
      className="mt-2 flex h-14 gap-1 rounded-[28px] border border-line bg-surface p-1"
    >
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 items-center justify-center rounded-3xl border text-sm ${
              active
                ? "border-line-gold bg-surface-active font-bold text-gold"
                : "border-transparent font-semibold text-muted"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
