// Single source of app data. Phase 1 keeps everything in localStorage;
// the exported functions are the seam for swapping in a real backend later.

import { defaultReminders } from "./reminders";
import type { Car, FuelEntry, Issue, Reminder } from "./types";

export type StoreState = {
  ready: boolean; // false on the server and before the first client read
  cars: Car[];
  reminders: Reminder[];
  fuel: FuelEntry[];
  issues: Issue[];
  activeCarId: string | null;
};

type PersistedKey = Exclude<keyof StoreState, "ready">;

const KEYS: Record<PersistedKey, string> = {
  cars: "kyra.v1.cars",
  reminders: "kyra.v1.reminders",
  fuel: "kyra.v1.fuel",
  issues: "kyra.v1.issues",
  activeCarId: "kyra.v1.activeCarId",
};

const EMPTY: StoreState = {
  ready: false,
  cars: [],
  reminders: [],
  fuel: [],
  issues: [],
  activeCarId: null,
};

let state: StoreState = EMPTY;
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Kyra: zápis do úložiště selhal", error);
  }
}

function load(): StoreState {
  return {
    ready: true,
    cars: read(KEYS.cars, []),
    reminders: read(KEYS.reminders, []),
    fuel: read(KEYS.fuel, []),
    issues: read(KEYS.issues, []),
    activeCarId: read(KEYS.activeCarId, null),
  };
}

function emit() {
  for (const listener of listeners) listener();
}

function update(patch: Partial<Omit<StoreState, "ready">>) {
  state = { ...getState(), ...patch };
  for (const key of Object.keys(patch) as PersistedKey[]) {
    write(KEYS[key], state[key]);
  }
  emit();
}

// Another tab or window changed the data.
function onStorage(event: StorageEvent) {
  if (event.key === null || event.key.startsWith("kyra.")) {
    state = load();
    emit();
  }
}

// --- Subscription (for useSyncExternalStore) ---

export function getState(): StoreState {
  if (!state.ready && typeof window !== "undefined") state = load();
  return state;
}

export function getServerState(): StoreState {
  return EMPTY;
}

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function newId(): string {
  return crypto.randomUUID();
}

// --- Selectors ---

export function selectActiveCar(s: StoreState): Car | undefined {
  return s.cars.find((car) => car.id === s.activeCarId) ?? s.cars[0];
}

export function selectReminders(s: StoreState, carId: string): Reminder[] {
  return s.reminders.filter((r) => r.carId === carId);
}

// --- Cars ---

export function addCar(input: Omit<Car, "id">): Car {
  const car: Car = { ...input, id: newId() };
  const s = getState();
  update({
    cars: [...s.cars, car],
    reminders: [...s.reminders, ...defaultReminders(car.id)],
    activeCarId: car.id,
  });
  return car;
}

export function updateCar(id: string, patch: Partial<Omit<Car, "id">>) {
  update({
    cars: getState().cars.map((car) => (car.id === id ? { ...car, ...patch } : car)),
  });
}

export function deleteCar(id: string) {
  const s = getState();
  const cars = s.cars.filter((car) => car.id !== id);
  update({
    cars,
    reminders: s.reminders.filter((r) => r.carId !== id),
    fuel: s.fuel.filter((f) => f.carId !== id),
    issues: s.issues.filter((i) => i.carId !== id),
    activeCarId: s.activeCarId === id ? (cars[0]?.id ?? null) : s.activeCarId,
  });
}

export function setActiveCar(id: string) {
  update({ activeCarId: id });
}

// --- Reminders ---

export function addReminder(input: Omit<Reminder, "id">): Reminder {
  const reminder: Reminder = { ...input, id: newId() };
  update({ reminders: [...getState().reminders, reminder] });
  return reminder;
}

export function updateReminder(id: string, patch: Partial<Omit<Reminder, "id" | "carId">>) {
  update({
    reminders: getState().reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  });
}

export function deleteReminder(id: string) {
  update({ reminders: getState().reminders.filter((r) => r.id !== id) });
}
