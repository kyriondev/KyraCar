import {
  GROQ_BASE_URL,
  GroqConfigError,
  groqErrorText,
  groqKey,
  groqModel,
  userMessageForStatus,
} from "@/lib/kyra/groq";
import type { ChatMessage, KyraRequest, KyraResponse, ToolCall } from "@/lib/kyra/protocol";
import { TOOL_DEFS } from "@/lib/kyra/tool-defs";

const MAX_MESSAGES = 40;
const MAX_CONTENT = 4000;

function systemPrompt(now: Date): string {
  const today = now.toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Prague",
  });
  return [
    "Jsi Kyra, asistentka v osobní appce do auta. Mluvíš česky, přirozeně a stručně, obvykle jednou až třemi větami.",
    "Odpovědi se můžou číst nahlas za jízdy, takže nepiš odrážky, tabulky ani markdown.",
    "Údaje o autě, tankování, problémech a připomínkách zjišťuj jen přes nástroje. Čísla si nikdy nevymýšlej. Když data nemáš, řekni to rovnou.",
    "Před zápisem tankování potřebuješ litry, stav tachometru a buď celkovou cenu, nebo cenu za litr. Když něco z toho chybí, zeptej se jednou krátkou otázkou. Po zápisu jen krátce potvrď.",
    "U brzd, řízení, pneumatik, světel a všeho, co ovlivňuje bezpečnost, vždy doporuč kontrolu v servisu. Při nehodě nebo ohrožení života odkaž na 112, při poruše na silnici na linku pomoci řidičům 1224.",
    "Do řídicí jednotky auta nic nezapisuješ a nemažeš chyby.",
    `Dnes je ${today}.`,
  ].join("\n");
}

function isToolCall(value: unknown): value is ToolCall {
  const v = value as ToolCall;
  return (
    typeof v?.id === "string" &&
    v.type === "function" &&
    typeof v.function?.name === "string" &&
    typeof v.function?.arguments === "string"
  );
}

/** Keeps only well-formed messages with known roles; drops anything extra (e.g. reasoning). */
function sanitize(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const clean: ChatMessage[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    const content = typeof m?.content === "string" ? m.content.slice(0, MAX_CONTENT) : "";
    if (m?.role === "user") clean.push({ role: "user", content });
    else if (m?.role === "assistant") {
      const toolCalls = Array.isArray(m.tool_calls) ? m.tool_calls.filter(isToolCall) : [];
      clean.push(
        toolCalls.length > 0
          ? { role: "assistant", content, tool_calls: toolCalls }
          : { role: "assistant", content },
      );
    } else if (m?.role === "tool" && typeof m.tool_call_id === "string") {
      clean.push({ role: "tool", tool_call_id: m.tool_call_id, name: String(m.name ?? ""), content });
    } else return null;
  }
  // Trimming must not start the history in the middle of a tool exchange.
  while (clean.length > 0 && clean[0].role !== "user") clean.shift();
  return clean.length > 0 ? clean : null;
}

async function complete(messages: ChatMessage[]): Promise<Response> {
  return fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: groqModel(),
      messages: [{ role: "system", content: systemPrompt(new Date()) }, ...messages],
      tools: TOOL_DEFS,
      tool_choice: "auto",
      temperature: 0.4,
      max_completion_tokens: 1024,
      reasoning_effort: "low",
      include_reasoning: false,
    }),
  });
}

function json(body: KyraResponse, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  let body: KyraRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Neplatný požadavek." }, 400);
  }
  const messages = sanitize(body?.messages);
  if (!messages) return json({ error: "Neplatná konverzace." }, 400);

  try {
    let res = await complete(messages);
    // gpt-oss on Groq occasionally fails to produce a parsable tool call; one retry usually helps.
    if (res.status === 400) {
      const text = await groqErrorText(res);
      console.error("Groq 400:", text);
      if (text.includes("tool") || text.includes("failed_generation")) res = await complete(messages);
      else return json({ error: userMessageForStatus(400) }, 502);
    }
    if (!res.ok) {
      console.error(`Groq ${res.status}:`, await groqErrorText(res));
      return json({ error: userMessageForStatus(res.status) }, 502);
    }

    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    const toolCalls = Array.isArray(msg?.tool_calls) ? msg.tool_calls.filter(isToolCall) : [];
    return json({
      message:
        toolCalls.length > 0
          ? { role: "assistant", content: msg?.content ?? "", tool_calls: toolCalls }
          : { role: "assistant", content: msg?.content ?? "" },
    });
  } catch (error) {
    if (error instanceof GroqConfigError) return json({ error: error.message }, 503);
    console.error("Kyra route error:", error);
    return json({ error: "Kyra teď neodpovídá. Zkus to prosím znovu." }, 502);
  }
}
