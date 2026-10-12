"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, TextInput, Toggle } from "@/components/form";
import { Sheet } from "@/components/sheet";
import { formatNumber, parseKm } from "@/lib/format";
import { deleteIssue, setIssueResolved, updateIssue } from "@/lib/storage";
import type { Issue } from "@/lib/types";

export function IssueSheet({ issue, onClose }: { issue: Issue | null; onClose: () => void }) {
  return (
    <Sheet open={issue !== null} onClose={onClose} title="Problém">
      {issue && <IssueForm issue={issue} onDone={onClose} />}
    </Sheet>
  );
}

function IssueForm({ issue, onDone }: { issue: Issue; onDone: () => void }) {
  const [title, setTitle] = useState(issue.title);
  const [note, setNote] = useState(issue.note ?? "");
  const [odometer, setOdometer] = useState(
    issue.odometerKm !== undefined ? formatNumber(issue.odometerKm) : "",
  );
  const [resolved, setResolved] = useState(issue.status === "resolved");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    updateIssue(issue.id, {
      title: title.trim(),
      note: note.trim() || undefined,
      odometerKm: parseKm(odometer),
    });
    if (resolved !== (issue.status === "resolved")) setIssueResolved(issue.id, resolved);
    onDone();
  }

  function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteIssue(issue.id);
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Co se děje">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Podrobnosti">
        <TextInput
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Kdy se to stává, jak to zní…"
        />
      </Field>
      <Field label="Tachometr (km)">
        <TextInput
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          inputMode="numeric"
          className="tabular-nums"
        />
      </Field>
      <Toggle label="Vyřešeno" checked={resolved} onChange={setResolved} />
      <Button type="submit" disabled={!title.trim()}>
        Uložit
      </Button>
      <Button type="button" variant="danger" onClick={remove}>
        {confirmDelete ? "Opravdu smazat?" : "Smazat problém"}
      </Button>
    </form>
  );
}
