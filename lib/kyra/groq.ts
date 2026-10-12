// Server-only helpers for the Groq API. The key never leaves the server.
import "server-only";

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export class GroqConfigError extends Error {}

export function groqKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new GroqConfigError("Na serveru chybí GROQ_API_KEY.");
  return key;
}

export function groqModel(): string {
  const model = process.env.GROQ_MODEL;
  if (!model) throw new GroqConfigError("Na serveru chybí GROQ_MODEL.");
  return model;
}

export function sttModel(): string {
  return process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";
}

/** Error text from a Groq error response, for logs. */
export async function groqErrorText(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? JSON.stringify(body);
  } catch {
    return res.statusText;
  }
}

/** Czech message for the user by HTTP status. */
export function userMessageForStatus(status: number): string {
  if (status === 401 || status === 403) return "Groq odmítl klíč. Zkontroluj GROQ_API_KEY.";
  if (status === 429) return "Groq je teď přetížený nebo jsi narazil na limit. Zkus to za chvilku.";
  if (status === 413) return "Nahrávka je moc dlouhá.";
  return "Kyra teď neodpovídá. Zkus to prosím znovu.";
}
