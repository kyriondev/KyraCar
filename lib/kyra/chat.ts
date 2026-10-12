// Chat state and the client-driven tool loop. Lives in memory, so the conversation
// survives tab switches but starts fresh on reload.

import type { ChatMessage, KyraResponse } from "./protocol";
import { runTool, type ToolAction } from "./tool-runner";

export type ChatItem =
  | { id: number; kind: "user"; text: string }
  | { id: number; kind: "kyra"; text: string; sources: string[] }
  | { id: number; kind: "action"; action: ToolAction }
  | { id: number; kind: "error"; text: string };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ChatState = { items: ChatItem[]; busy: boolean };

const MAX_TOOL_ROUNDS = 5;

let state: ChatState = { items: [], busy: false };
let history: ChatMessage[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function set(patch: Partial<ChatState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

function push(item: DistributiveOmit<ChatItem, "id">) {
  set({ items: [...state.items, { ...item, id: nextId++ } as ChatItem] });
}

export function getChat(): ChatState {
  return state;
}

export function subscribeChat(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearChat() {
  history = [];
  set({ items: [] });
}

async function callKyra(messages: ChatMessage[]): Promise<KyraResponse> {
  try {
    const res = await fetch("/api/kyra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    return (await res.json()) as KyraResponse;
  } catch {
    return { error: "Nejsem online. Zkontroluj připojení." };
  }
}

/** Sends a user message and runs tool rounds until Kyra answers. Returns her reply text. */
export async function sendToKyra(text: string): Promise<string | undefined> {
  const content = text.trim();
  if (!content || state.busy) return;
  push({ kind: "user", text: content });
  set({ busy: true });

  const turn: ChatMessage[] = [...history, { role: "user", content }];
  const sources = new Set<string>();

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await callKyra(turn);
      if ("error" in response) {
        push({ kind: "error", text: response.error });
        return;
      }
      const message = response.message;
      turn.push(message);

      if (!message.tool_calls?.length) {
        const reply = message.content.trim() || "Promiň, na to teď nemám odpověď.";
        push({ kind: "kyra", text: reply, sources: [...sources] });
        history = turn;
        return reply;
      }

      if (round === MAX_TOOL_ROUNDS) break;
      for (const call of message.tool_calls) {
        const outcome = runTool(call.function.name, call.function.arguments);
        if (outcome.source) sources.add(outcome.source);
        if (outcome.action) push({ kind: "action", action: outcome.action });
        turn.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(outcome.result),
        });
      }
    }
    push({ kind: "error", text: "Zamotala jsem se. Zkus to zeptat jinak." });
  } finally {
    set({ busy: false });
  }
}
