import type { ReactNode } from "react";

export function PageHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="px-6">
      <div className="flex h-13 items-center justify-between">
        <h1 className="text-[38px] leading-none font-bold tracking-heading">
          {title}
        </h1>
        {action}
      </div>
      {children}
    </header>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <div className="noscroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pt-4 pb-6 *:shrink-0">
      {children}
    </div>
  );
}

export function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col gap-1.5 rounded-[20px] border border-line bg-surface p-5">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="text-[13px] leading-normal font-medium text-muted">{text}</p>
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-1.5 text-[11px] font-semibold tracking-[2.4px] text-muted uppercase">
      {children}
    </h2>
  );
}
