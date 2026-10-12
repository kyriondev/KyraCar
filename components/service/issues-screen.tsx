"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowUpIcon } from "@/components/icons";
import { EmptyCard, PageBody, SectionLabel } from "@/components/page";
import { formatDayMonth, formatNumber } from "@/lib/format";
import { addIssue, selectActiveCar, selectIssues } from "@/lib/storage";
import type { Issue } from "@/lib/types";
import { useStore } from "@/lib/use-store";
import { IssueSheet } from "./issue-sheet";

const newestFirst = (a?: string, b?: string) => (b ?? "").localeCompare(a ?? "");

export function IssuesScreen() {
  const state = useStore();
  const car = selectActiveCar(state);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<Issue | null>(null);

  const { open, resolved } = useMemo(() => {
    const all = car ? selectIssues(state, car.id) : [];
    return {
      open: all
        .filter((i) => i.status === "open")
        .sort((a, b) => newestFirst(a.createdAt, b.createdAt)),
      resolved: all
        .filter((i) => i.status === "resolved")
        .sort((a, b) => newestFirst(a.resolvedAt, b.resolvedAt)),
    };
  }, [state, car]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!car || !title) return;
    addIssue({ carId: car.id, title, odometerKm: car.odometerKm, source: "text" });
    setDraft("");
  }

  return (
    <>
      <PageBody>
        {state.ready && !car && (
          <Link href="/garaz" className="block">
            <EmptyCard
              title="Nejdřív přidej auto"
              text="Problémy se zapisují ke konkrétnímu autu. Auto přidáš v Garáži."
            />
          </Link>
        )}

        {car && open.length === 0 && resolved.length === 0 && (
          <EmptyCard
            title="Zatím žádné problémy"
            text="Když něco skřípe, klepe nebo svítí, zapiš to dole. Hodí se to pak v servisu."
          />
        )}

        {open.length > 0 && (
          <>
            <SectionLabel>Otevřené · {open.length}</SectionLabel>
            {open.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onOpen={() => setEditing(issue)} />
            ))}
          </>
        )}

        {resolved.length > 0 && (
          <>
            <SectionLabel>Vyřešené · {resolved.length}</SectionLabel>
            {resolved.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onOpen={() => setEditing(issue)} />
            ))}
          </>
        )}
      </PageBody>

      {car && (
        <form onSubmit={submit} className="shrink-0 px-6 pt-2 pb-3">
          <div className="flex h-14 items-center gap-2.5 rounded-[28px] border border-line bg-surface pr-1.5 pl-5 focus-within:border-gold">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Popsat problém s autem"
              placeholder="Co se děje s autem?"
              enterKeyHint="send"
              className="h-11 min-w-0 flex-1 bg-transparent font-serif text-[22px] font-medium text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Zapsat problém"
              disabled={!draft.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-bg disabled:opacity-40"
            >
              <ArrowUpIcon size={22} strokeWidth={1.8} />
            </button>
          </div>
        </form>
      )}

      <IssueSheet issue={editing} onClose={() => setEditing(null)} />
    </>
  );
}

const SOURCE_LABEL: Record<Issue["source"], string | undefined> = {
  text: undefined,
  voice: "zapsáno hlasem",
  kyra: "zapsala Kyra",
};

function issueMeta(issue: Issue): string {
  const parts = [formatDayMonth(issue.createdAt)];
  if (issue.status === "resolved" && issue.resolvedAt) {
    parts.push(`vyřešeno ${formatDayMonth(issue.resolvedAt)}`);
  } else if (SOURCE_LABEL[issue.source]) {
    parts.push(SOURCE_LABEL[issue.source]!);
  } else if (issue.odometerKm !== undefined) {
    parts.push(`${formatNumber(issue.odometerKm)} km`);
  }
  return parts.join(" · ");
}

function IssueCard({ issue, onOpen }: { issue: Issue; onOpen: () => void }) {
  const resolved = issue.status === "resolved";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-surface p-4 text-left"
    >
      <span className="flex items-start justify-between gap-3">
        <span className={`text-base leading-[1.3] font-semibold ${resolved ? "text-ink-soft" : ""}`}>
          {issue.title}
        </span>
        <span
          className={`flex h-6 shrink-0 items-center rounded-xl border px-2.5 text-[11px] font-bold tracking-[0.6px] ${
            resolved ? "border-kyra-line bg-kyra-bg text-green" : "border-line-dashed text-gold"
          }`}
        >
          {resolved ? "Vyřešeno" : "Otevřený"}
        </span>
      </span>
      {issue.note && (
        <span
          className={`text-sm leading-[1.45] font-medium ${resolved ? "text-muted" : "text-ink-soft"}`}
        >
          {issue.note}
        </span>
      )}
      <span className="text-xs font-medium text-muted tabular-nums">{issueMeta(issue)}</span>
      {issue.kyraNote && !resolved && (
        <span className="flex flex-col gap-1.5 rounded-[14px] border border-kyra-line bg-kyra-bg px-3.5 py-3">
          <span className="text-[11px] font-bold tracking-[2.4px] text-gold">KYRA</span>
          <span className="font-serif text-[19px] leading-[1.3] font-medium">{issue.kyraNote}</span>
        </span>
      )}
    </button>
  );
}
