"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/components/form";
import { Sheet } from "@/components/sheet";
import { formatNumber, parseKm } from "@/lib/format";
import { REMINDER_KINDS } from "@/lib/reminders";
import { addReminder, deleteReminder, updateReminder } from "@/lib/storage";
import type { Reminder } from "@/lib/types";

export type ReminderTarget = Reminder | { carId: string }; // the latter adds a custom one

export function ReminderSheet({
  target,
  onClose,
}: {
  target: ReminderTarget | null;
  onClose: () => void;
}) {
  const title = target && "id" in target ? target.label : "Nová připomínka";
  return (
    <Sheet open={target !== null} onClose={onClose} title={title}>
      {target && <ReminderForm target={target} onDone={onClose} />}
    </Sheet>
  );
}

function ReminderForm({ target, onDone }: { target: ReminderTarget; onDone: () => void }) {
  const existing = "id" in target ? target : undefined;
  const kind = existing?.kind ?? "custom";
  const info = REMINDER_KINDS[kind];

  const [label, setLabel] = useState(existing?.label ?? "");
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [dueKm, setDueKm] = useState(
    existing?.dueKm !== undefined ? formatNumber(existing.dueKm) : "",
  );
  const [note, setNote] = useState(existing?.note ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    const data = {
      label: kind === "custom" ? label.trim() : info.label,
      dueDate: dueDate || undefined,
      dueKm: info.tracksKm ? parseKm(dueKm) : undefined,
      note: note.trim() || undefined,
    };
    if (!data.label) return;
    if (existing) updateReminder(existing.id, data);
    else addReminder({ ...data, carId: target.carId, kind });
    onDone();
  }

  function clearOrDelete() {
    if (!existing) return;
    // Built-in reminders stay in the list, only their data is cleared.
    if (kind === "custom") deleteReminder(existing.id);
    else updateReminder(existing.id, { dueDate: undefined, dueKm: undefined, note: undefined });
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {kind === "custom" && (
        <Field label="Název">
          <TextInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Např. přezutí pneumatik"
            autoComplete="off"
            required
          />
        </Field>
      )}
      <Field label={info.dateLabel}>
        <TextInput
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="text-left"
        />
      </Field>
      {info.tracksKm && (
        <Field label="Při stavu tachometru (km)">
          <TextInput
            value={dueKm}
            onChange={(e) => setDueKm(e.target.value)}
            inputMode="numeric"
            placeholder="Např. 120 000"
            className="tabular-nums"
          />
        </Field>
      )}
      <Field label="Poznámka">
        <TextInput
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={info.notePlaceholder}
          autoComplete="off"
        />
      </Field>
      <Button type="submit" disabled={kind === "custom" && !label.trim()} className="mt-2">
        Uložit
      </Button>
      {existing && (
        <Button type="button" variant="secondary" onClick={clearOrDelete}>
          {kind === "custom" ? "Smazat připomínku" : "Vymazat údaje"}
        </Button>
      )}
    </form>
  );
}
