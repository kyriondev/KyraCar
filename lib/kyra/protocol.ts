// Messages exchanged between the client and /api/kyra (OpenAI-compatible subset).

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; name: string; content: string };

export type KyraRequest = { messages: ChatMessage[] };

export type KyraResponse =
  | { message: Extract<ChatMessage, { role: "assistant" }> }
  | { error: string };
