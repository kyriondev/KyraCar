import { normalizeFaultCode, type FaultExplanation } from "@/lib/faults";
import {
  GROQ_BASE_URL,
  GroqConfigError,
  groqErrorText,
  groqKey,
  groqModel,
  userMessageForStatus,
} from "@/lib/kyra/groq";

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Krátký český název chyby, 2 až 4 slova." },
    severity: { type: "string", enum: ["low", "medium", "high"] },
    explanation: { type: "string" },
    checks: { type: "array", items: { type: "string" } },
  },
  required: ["title", "severity", "explanation", "checks"],
  additionalProperties: false,
};

function prompt(code: string, car: string): string {
  return [
    `Auto: ${car}. Uživatel má uložený chybový kód ${code} (OBD-II, nebo pětimístný kód VAG z K-line).`,
    "Vysvětli ho česky laikovi dvěma až třemi větami: co znamená, nejčastější příčina u tohoto auta a jestli se s tím dá jezdit.",
    "Do checks dej tři konkrétní věci, které zkontrolovat jako první, od nejlevnější a nejpravděpodobnější.",
    "severity: low = může počkat, medium = opravit do pár týdnů, high = nejezdit nebo hned do servisu.",
    "U brzd, řízení, airbagů a přehřívání motoru vždy doporuč servis a dej severity high.",
    "Když si významem kódu nejsi jistá, napiš to do explanation, nic si nevymýšlej a dej severity medium.",
  ].join("\n");
}

export async function POST(request: Request) {
  let body: { code?: unknown; car?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Neplatný požadavek." }, { status: 400 });
  }
  const code = typeof body.code === "string" ? normalizeFaultCode(body.code) : undefined;
  if (!code) return Response.json({ error: "Neplatný chybový kód." }, { status: 400 });
  const car = typeof body.car === "string" && body.car.trim() ? body.car.trim().slice(0, 120) : "neznámé auto";

  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: groqModel(),
        messages: [
          { role: "system", content: "Jsi Kyra, zkušená automechanička. Odpovídáš česky a věcně." },
          { role: "user", content: prompt(code, car) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "fault_explanation", strict: true, schema: SCHEMA },
        },
        temperature: 0.2,
        max_completion_tokens: 1024,
        reasoning_effort: "low",
        include_reasoning: false,
      }),
    });
    if (!res.ok) {
      console.error(`Groq explain ${res.status}:`, await groqErrorText(res));
      return Response.json({ error: userMessageForStatus(res.status) }, { status: 502 });
    }
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}") as FaultExplanation;
    if (!parsed.title || !parsed.explanation || !Array.isArray(parsed.checks)) {
      return Response.json({ error: "Kyra vrátila neúplné vysvětlení. Zkus to znovu." }, { status: 502 });
    }
    const explanation: FaultExplanation = {
      title: parsed.title,
      severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
      explanation: parsed.explanation,
      checks: parsed.checks.filter((c) => typeof c === "string").slice(0, 5),
    };
    return Response.json(explanation);
  } catch (error) {
    if (error instanceof GroqConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("Explain route error:", error);
    return Response.json({ error: "Vysvětlení se nepovedlo. Zkus to znovu." }, { status: 502 });
  }
}
