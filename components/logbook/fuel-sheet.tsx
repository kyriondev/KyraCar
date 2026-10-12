"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, TextInput, Toggle } from "@/components/form";
import { Sheet } from "@/components/sheet";
import { formatDecimal, formatNumber, parseDecimal, parseKm, todayIso } from "@/lib/format";
import { addFuelEntry, deleteFuelEntry, updateFuelEntry } from "@/lib/storage";
import type { Car, FuelEntry } from "@/lib/types";

export type FuelTarget = FuelEntry | { car: Car }; // the latter adds a new entry

export function FuelSheet({
  target,
  onClose,
}: {
  target: FuelTarget | null;
  onClose: () => void;
}) {
  const title = target && "id" in target ? "Upravit tankování" : "Tankování";
  return (
    <Sheet open={target !== null} onClose={onClose} title={title}>
      {target && <FuelForm target={target} onDone={onClose} />}
    </Sheet>
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function FuelForm({ target, onDone }: { target: FuelTarget; onDone: () => void }) {
  const existing = "id" in target ? target : undefined;
  const odometerHint = "car" in target ? target.car.odometerKm : undefined;

  const [date, setDate] = useState(existing?.date.slice(0, 10) ?? todayIso());
  const [liters, setLiters] = useState(existing ? formatDecimal(existing.liters, 2) : "");
  const [price, setPrice] = useState(existing ? formatDecimal(existing.pricePerLiter, 2) : "");
  const [total, setTotal] = useState(existing ? formatDecimal(existing.totalCzk, 2) : "");
  const [odometer, setOdometer] = useState(
    existing ? formatNumber(existing.odometerKm) : "",
  );
  const [isFull, setIsFull] = useState(existing?.isFull ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const l = parseDecimal(liters);
  const p = parseDecimal(price);
  const t = parseDecimal(total);
  const km = parseKm(odometer);
  // Any two of liters, price and total are enough.
  const computedTotal = l && p ? round2(l * p) : undefined;
  const computedPrice = l && t ? round2(t / l) : undefined;
  const valid = !!date && !!l && l > 0 && km !== undefined && (!!p || !!t);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || !l || km === undefined) return;
    const data = {
      date,
      liters: l,
      pricePerLiter: p ?? computedPrice ?? 0,
      totalCzk: t ?? computedTotal ?? 0,
      odometerKm: km,
      isFull,
    };
    if (existing) updateFuelEntry(existing.id, data);
    else if ("car" in target) addFuelEntry({ ...data, carId: target.car.id });
    onDone();
  }

  function remove() {
    if (!existing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteFuelEntry(existing.id);
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Datum">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Litry">
          <TextInput
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            inputMode="decimal"
            placeholder="38,4"
            className="tabular-nums"
            required
          />
        </Field>
        <Field label="Kč za litr">
          <TextInput
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder={computedPrice ? formatDecimal(computedPrice, 2) : "45,00"}
            className="tabular-nums"
          />
        </Field>
        <Field label="Celkem Kč">
          <TextInput
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            inputMode="decimal"
            placeholder={computedTotal ? formatDecimal(computedTotal, 2) : "1 728"}
            className="tabular-nums"
          />
        </Field>
      </div>
      <Field label="Tachometr (km)">
        <TextInput
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          inputMode="numeric"
          placeholder={odometerHint !== undefined ? `naposledy ${formatNumber(odometerHint)}` : "113 424"}
          className="tabular-nums"
          required
        />
      </Field>
      <Toggle label="Natankováno do plna" checked={isFull} onChange={setIsFull} />
      <p className="-mt-2 text-xs leading-normal font-medium text-muted">
        Spotřeba se počítá mezi tankováními do plna.
      </p>
      <Button type="submit" disabled={!valid}>
        Uložit
      </Button>
      {existing && (
        <Button type="button" variant="danger" onClick={remove}>
          {confirmDelete ? "Opravdu smazat?" : "Smazat tankování"}
        </Button>
      )}
    </form>
  );
}
