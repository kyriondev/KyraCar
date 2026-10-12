import type { FaultSeverity } from "./types";

// OBD-II ("P0171") or VAG/KW1281 5-digit codes ("16684").
const CODE_PATTERN = /^([PCBU][0-9A-F]{4}|\d{5})$/;

export function normalizeFaultCode(input: string): string | undefined {
  const code = input.replace(/\s/g, "").toUpperCase();
  return CODE_PATTERN.test(code) ? code : undefined;
}

export const SEVERITY_LABEL: Record<FaultSeverity, string> = {
  low: "NÍZKÁ",
  medium: "STŘEDNÍ",
  high: "VYSOKÁ",
};

export type FaultExplanation = {
  title: string;
  severity: FaultSeverity;
  explanation: string;
  checks: string[];
};
