"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/components/form";
import { Sheet } from "@/components/sheet";
import { formatNumber, parseKm } from "@/lib/format";
import { addCar, deleteCar, updateCar } from "@/lib/storage";
import type { Car } from "@/lib/types";

export function CarSheet({
  open,
  car,
  onClose,
}: {
  open: boolean;
  car?: Car; // undefined adds a new car
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={car ? "Upravit auto" : "Přidat auto"}>
      <CarForm car={car} onDone={onClose} />
    </Sheet>
  );
}

function CarForm({ car, onDone }: { car?: Car; onDone: () => void }) {
  const [name, setName] = useState(car?.name ?? "");
  const [engine, setEngine] = useState(car?.engine ?? "");
  const [plate, setPlate] = useState(car?.plate ?? "");
  const [odometer, setOdometer] = useState(
    car?.odometerKm !== undefined ? formatNumber(car.odometerKm) : "",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const data = {
      name: name.trim(),
      engine: engine.trim() || undefined,
      plate: plate.trim().toUpperCase() || undefined,
      odometerKm: parseKm(odometer),
    };
    if (!data.name) return;
    if (car) updateCar(car.id, data);
    else addCar(data);
    onDone();
  }

  function remove() {
    if (!car) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCar(car.id);
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Název">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Škoda Fabia"
          autoComplete="off"
          required
        />
      </Field>
      <Field label="Motor">
        <TextInput
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          placeholder="1.4 MPI"
          autoComplete="off"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SPZ">
          <TextInput
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="1AB 2345"
            autoComplete="off"
            autoCapitalize="characters"
            className="uppercase"
          />
        </Field>
        <Field label="Tachometr (km)">
          <TextInput
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="tabular-nums"
          />
        </Field>
      </div>
      <Button type="submit" disabled={!name.trim()} className="mt-2">
        {car ? "Uložit" : "Přidat auto"}
      </Button>
      {car && (
        <Button type="button" variant="danger" onClick={remove}>
          {confirmDelete ? "Opravdu smazat i se záznamy?" : "Smazat auto"}
        </Button>
      )}
    </form>
  );
}
