"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { PlusIcon } from "@/components/icons";
import { EmptyCard, PageBody, SectionLabel } from "@/components/page";
import { normalizeFaultCode, SEVERITY_LABEL, type FaultExplanation } from "@/lib/faults";
import { formatDayMonth } from "@/lib/format";
import { sendToKyra } from "@/lib/kyra/chat";
import {
  addFaultCode,
  deleteFaultCode,
  selectActiveCar,
  selectFaults,
  updateFaultCode,
} from "@/lib/storage";
import type { Car, FaultCode, FaultSeverity } from "@/lib/types";
import { useStore } from "@/lib/use-store";

async function fetchExplanation(code: string, car: Car): Promise<FaultExplanation> {
  let res: Response;
  try {
    res = await fetch("/api/explain-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, car: [car.name, car.engine].filter(Boolean).join(" ") }),
    });
  } catch {
    throw new Error("Nejsem online. Zkontroluj připojení.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Vysvětlení se nepovedlo.");
  return data as FaultExplanation;
}

export function FaultsScreen() {
  const state = useStore();
  const car = selectActiveCar(state);
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const faults = useMemo(
    () =>
      car
        ? selectFaults(state, car.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [state, car],
  );
  const expanded = expandedId ?? faults[0]?.id ?? null;

  async function explain(fault: FaultCode) {
    if (!car) return;
    setLoading((prev) => new Set(prev).add(fault.id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fault.id];
      return next;
    });
    try {
      updateFaultCode(fault.id, await fetchExplanation(fault.code, car));
    } catch (error) {
      setErrors((prev) => ({ ...prev, [fault.id]: (error as Error).message }));
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(fault.id);
        return next;
      });
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!car) return;
    const code = normalizeFaultCode(draft);
    if (!code) {
      setInputError("Kód má tvar P0171, nebo pět číslic u VAG.");
      return;
    }
    setInputError(null);
    setDraft("");
    const existing = faults.find((f) => f.code === code);
    if (existing) {
      setExpandedId(existing.id);
      return;
    }
    const fault = addFaultCode({ carId: car.id, code, source: "manual" });
    setExpandedId(fault.id);
    void explain(fault);
  }

  function askKyra(fault: FaultCode) {
    void sendToKyra(
      `Mám na autě chybu ${fault.code}${fault.title ? ` (${fault.title})` : ""}. Co to pro mě znamená a co mám udělat?`,
    );
    router.push("/kyra");
  }

  return (
    <>
      <PageBody>
        {state.ready && !car && (
          <Link href="/garaz" className="block">
            <EmptyCard
              title="Nejdřív přidej auto"
              text="Chybové kódy se ukládají ke konkrétnímu autu. Auto přidáš v Garáži."
            />
          </Link>
        )}

        {car && (
          <p className="text-[13px] font-medium text-muted">
            Kódy zatím zadáváš ručně. Číst je z auta půjde s adaptérem.
          </p>
        )}

        {car && faults.length === 0 && (
          <EmptyCard
            title="Žádné chybové kódy"
            text="Zadej kód z diagnostiky nebo ze servisu a Kyra vysvětlí, co znamená a co zkontrolovat."
          />
        )}

        {faults.map((fault) => (
          <FaultCard
            key={fault.id}
            fault={fault}
            expanded={fault.id === expanded}
            loading={loading.has(fault.id)}
            error={errors[fault.id]}
            onToggle={() => setExpandedId(fault.id === expanded ? "" : fault.id)}
            onExplain={() => void explain(fault)}
            onAsk={() => askKyra(fault)}
            onDelete={() => deleteFaultCode(fault.id)}
          />
        ))}
      </PageBody>

      {car && (
        <form onSubmit={submit} className="shrink-0 px-6 pt-2 pb-3">
          {inputError && (
            <p role="status" className="mb-2 px-1 text-xs font-medium text-warn">
              {inputError}
            </p>
          )}
          <div className="flex h-14 items-center gap-2.5 rounded-[28px] border border-line bg-surface pr-1.5 pl-5 focus-within:border-gold">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              aria-label="Chybový kód"
              placeholder="Zadej kód, např. P0171"
              autoCapitalize="characters"
              autoComplete="off"
              enterKeyHint="done"
              className="h-11 min-w-0 flex-1 bg-transparent text-base font-semibold tracking-[0.5px] text-ink placeholder:font-medium placeholder:tracking-normal placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Přidat kód"
              disabled={!draft.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-bg disabled:opacity-40"
            >
              <PlusIcon size={22} strokeWidth={2} />
            </button>
          </div>
        </form>
      )}
    </>
  );
}

const SEVERITY_STYLE: Record<FaultSeverity, { badge: string; pill: string }> = {
  low: { badge: "bg-surface-2 text-gold", pill: "border-line-dashed text-gold" },
  medium: { badge: "bg-warn-bg text-warn", pill: "border-warn/40 text-warn" },
  high: { badge: "bg-warn text-bg", pill: "border-warn bg-warn-bg text-warn" },
};

function FaultCard({
  fault,
  expanded,
  loading,
  error,
  onToggle,
  onExplain,
  onAsk,
  onDelete,
}: {
  fault: FaultCode;
  expanded: boolean;
  loading: boolean;
  error?: string;
  onToggle: () => void;
  onExplain: () => void;
  onAsk: () => void;
  onDelete: () => void;
}) {
  const style = SEVERITY_STYLE[fault.severity ?? "medium"];
  const subtitle = `${fault.source === "manual" ? "Zadáno ručně" : "Uložená chyba"} · ${formatDayMonth(fault.createdAt)}`;

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex items-center gap-3.5 rounded-[20px] border border-line bg-surface p-4 text-left"
      >
        <span
          className={`rounded-xl px-3 py-2 text-lg font-bold tracking-[0.5px] tabular-nums ${style.badge}`}
        >
          {fault.code}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[17px] font-semibold">
            {fault.title ?? (loading ? "Zjišťuji…" : "Bez vysvětlení")}
          </span>
          <span className="truncate text-[13px] font-medium text-muted">{subtitle}</span>
        </span>
        {fault.severity && (
          <span
            className={`flex h-6 shrink-0 items-center rounded-xl border px-2.5 text-[11px] font-bold tracking-[1.2px] ${style.pill}`}
          >
            {SEVERITY_LABEL[fault.severity]}
          </span>
        )}
      </button>

      {expanded && (
        <>
          {loading && (
            <div className="rounded-[20px] border border-kyra-line bg-kyra-bg px-[18px] py-4">
              <span className="animate-pulse font-serif text-[21px] text-muted">
                Kyra hledá vysvětlení…
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-start gap-3 rounded-[20px] border border-warn/40 bg-warn-bg px-4 py-3.5">
              <span className="text-sm font-medium text-warn">{error}</span>
              <button
                type="button"
                onClick={onExplain}
                className="h-11 rounded-full border border-warn/40 px-4 text-sm font-semibold text-warn"
              >
                Zkusit znovu
              </button>
            </div>
          )}

          {!loading && !error && !fault.explanation && (
            <button
              type="button"
              onClick={onExplain}
              className="flex h-12 items-center justify-center rounded-full border border-line text-[15px] font-semibold"
            >
              Nechat Kyru vysvětlit
            </button>
          )}

          {fault.explanation && (
            <div className="flex flex-col gap-2 rounded-[20px] border border-kyra-line bg-kyra-bg px-[18px] py-4">
              <span className="text-[11px] font-bold tracking-[2.4px] text-gold">KYRA VYSVĚTLUJE</span>
              <p className="font-serif text-[21px] leading-[1.3] font-medium lining-nums">
                {fault.explanation}
              </p>
            </div>
          )}

          {fault.checks && fault.checks.length > 0 && (
            <>
              <SectionLabel>Co zkontrolovat první</SectionLabel>
              <ol className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface">
                {fault.checks.map((check, i) => (
                  <li
                    key={i}
                    className="flex min-h-[52px] items-center gap-3.5 border-t border-line px-4 py-2.5 first:border-t-0"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line-gold text-[13px] font-bold text-gold">
                      {i + 1}
                    </span>
                    <span className="text-[15px] font-medium">{check}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <button
            type="button"
            onClick={onAsk}
            className="mt-1.5 flex h-[52px] items-center justify-center rounded-[26px] bg-gold text-[15px] font-bold text-bg"
          >
            Zeptat se Kyry na tuhle chybu
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-11 items-center justify-center text-sm font-semibold text-muted"
          >
            Odebrat kód
          </button>
        </>
      )}
    </>
  );
}
