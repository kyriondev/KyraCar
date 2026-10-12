export type Car = {
  id: string;
  name: string;
  plate?: string;
  engine?: string;
  odometerKm?: number;
};

export type FuelEntry = {
  id: string;
  carId: string;
  date: string; // ISO
  liters: number;
  pricePerLiter: number;
  totalCzk: number;
  odometerKm: number;
  isFull: boolean; // consumption is computed between full tanks only
};

export type Issue = {
  id: string;
  carId: string;
  title: string;
  note?: string;
  createdAt: string; // ISO
  odometerKm?: number;
  status: "open" | "resolved";
  resolvedAt?: string;
  source: "text" | "voice" | "kyra";
  kyraNote?: string; // Kyra's short take on the issue
};

export type ReminderKind = "insurance" | "inspection" | "vignette" | "oil" | "custom";

export type Reminder = {
  id: string;
  carId: string;
  kind: ReminderKind;
  label: string;
  dueDate?: string; // YYYY-MM-DD
  dueKm?: number;
  note?: string; // e.g. insurer name
};

export type FaultSeverity = "low" | "medium" | "high";

export type FaultCode = {
  id: string;
  carId: string;
  code: string; // "P0171" or a 5-digit VAG code
  createdAt: string; // ISO
  source: "manual" | "obd";
  // Filled in by Kyra's explanation:
  title?: string;
  severity?: FaultSeverity;
  explanation?: string;
  checks?: string[];
};
