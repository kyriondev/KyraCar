"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowUpIcon, CheckIcon, KeyboardIcon, MicIcon } from "@/components/icons";
import { PageHeader } from "@/components/page";
import { clearChat, getChat, sendToKyra, subscribeChat, type ChatItem } from "@/lib/kyra/chat";
import { speak, stopSpeaking, transcribe } from "@/lib/kyra/voice";
import { useRecorder } from "@/lib/use-recorder";

const SUGGESTIONS = [
  "Kolik mě auto stálo tenhle měsíc?",
  "Jakou mám spotřebu?",
  "Kdy mi končí STK?",
  "Pomoc na silnici",
  "Zapiš problém",
];

const BAR_HEIGHTS = [8, 14, 22, 12, 28, 18, 34, 20, 30, 40];

const EMPTY_CHAT = { items: [], busy: false };

export function KyraScreen() {
  const chat = useSyncExternalStore(subscribeChat, getChat, () => EMPTY_CHAT);
  const recorder = useRecorder();
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  const recording = recorder.status === "recording";
  const working = chat.busy || transcribing;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat.items.length, chat.busy]);

  useEffect(() => stopSpeaking, []);

  async function ask(text: string, { aloud = false } = {}) {
    setVoiceError(null);
    const reply = await sendToKyra(text);
    if (reply && aloud) speak(reply);
  }

  async function toggleMic() {
    setVoiceError(null);
    if (recording) {
      const audio = await recorder.stop();
      if (!audio) return;
      setTranscribing(true);
      try {
        const text = await transcribe(audio);
        if (text) await ask(text, { aloud: true });
        else setVoiceError("Nic jsem neslyšela. Zkus to znovu.");
      } catch (error) {
        setVoiceError((error as Error).message);
      } finally {
        setTranscribing(false);
      }
      return;
    }
    stopSpeaking();
    try {
      await recorder.start();
    } catch (error) {
      setVoiceError((error as Error).message);
      setTyping(true);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || working) return;
    setDraft("");
    void ask(text);
  }

  const label = recording
    ? "Poslouchám… klepni, až domluvíš"
    : transcribing
      ? "Přepisuju…"
      : chat.busy
        ? "Kyra přemýšlí…"
        : "Klepni a mluv";

  return (
    <>
      <PageHeader
        title="Kyra"
        action={
          chat.items.length > 0 ? (
            <button
              type="button"
              onClick={clearChat}
              disabled={working}
              className="flex h-11 items-center rounded-full border border-line bg-surface px-3.5 text-xs font-semibold tracking-[0.4px] text-muted"
            >
              Nový rozhovor
            </button>
          ) : (
            <span className="flex h-8 items-center rounded-2xl border border-line bg-surface px-3 text-xs font-semibold tracking-[0.4px] text-muted">
              Groq · česky
            </span>
          )
        }
      >
        <p className="mt-1 text-[13px] font-medium text-muted">
          Zná tvoje auto, deník, problémy i připomínky.
        </p>
      </PageHeader>

      <div
        ref={scroller}
        className="noscroll flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-4"
        aria-live="polite"
      >
        <div className="mt-auto flex flex-col gap-3.5 pb-2">
          {chat.items.length === 0 && (
            <p className="font-serif text-[21px] leading-[1.3] font-medium text-muted">
              Ahoj. Zeptej se mě na spotřebu, útratu nebo připomínky, nebo mi nadiktuj tankování.
            </p>
          )}
          {chat.items.map((item) => (
            <ChatRow key={item.id} item={item} />
          ))}
          {chat.busy && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold tracking-[2.4px] text-gold">KYRA</span>
              <span className="animate-pulse font-serif text-[21px] text-muted">…</span>
            </div>
          )}
        </div>
      </div>

      <div className="noscroll my-3 flex shrink-0 gap-2 overflow-x-auto px-6">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={working || recording}
            onClick={() => void ask(s)}
            className="h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold whitespace-nowrap disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {typing ? (
        <form onSubmit={submit} className="flex shrink-0 items-center gap-2 px-6 pb-3.5">
          <div className="flex h-14 min-w-0 flex-1 items-center gap-2.5 rounded-[28px] border border-line bg-surface pr-1.5 pl-5 focus-within:border-gold">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Napsat Kyře"
              placeholder="Napiš Kyře…"
              enterKeyHint="send"
              autoFocus
              className="h-11 min-w-0 flex-1 bg-transparent text-base font-medium text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Odeslat"
              disabled={!draft.trim() || working}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-bg disabled:opacity-40"
            >
              <ArrowUpIcon size={22} strokeWidth={1.8} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Mluvit místo psaní"
            onClick={() => setTyping(false)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-muted"
          >
            <MicIcon size={22} />
          </button>
        </form>
      ) : (
        <div className="flex shrink-0 flex-col items-center gap-1.5 pb-3.5">
          <div className="flex h-16 items-center justify-center gap-2.5">
            <Bars heights={BAR_HEIGHTS} level={recording ? recorder.level : 0} active={recording} />
            <button
              type="button"
              aria-label={recording ? "Dokončit a odeslat" : "Mluvit s Kyrou"}
              aria-pressed={recording}
              disabled={working}
              onClick={() => void toggleMic()}
              className={`flex size-16 shrink-0 items-center justify-center rounded-full border-[1.5px] border-gold disabled:opacity-40 ${
                recording ? "bg-bg text-gold" : "bg-gold text-bg"
              }`}
            >
              <MicIcon size={26} strokeWidth={1.8} />
            </button>
            <Bars
              heights={[...BAR_HEIGHTS].reverse()}
              level={recording ? recorder.level : 0}
              active={recording}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.4px] text-muted">
            <span role="status">{voiceError ?? label}</span>
            {!recording && (
              <button
                type="button"
                onClick={() => setTyping(true)}
                aria-label="Psát místo mluvení"
                className="-my-3 flex size-11 items-center justify-center text-muted"
              >
                <KeyboardIcon size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Bars({ heights, level, active }: { heights: number[]; level: number; active: boolean }) {
  return (
    <div className="flex h-11 items-center gap-1" aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-sm transition-[height] duration-75 ${active ? "bg-gold" : "bg-line"}`}
          style={{ height: active ? 4 + (h - 4) * Math.max(0.15, level) : 4 }}
        />
      ))}
    </div>
  );
}

function ChatRow({ item }: { item: ChatItem }) {
  switch (item.kind) {
    case "user":
      return (
        <div className="max-w-[280px] self-end rounded-[20px_20px_6px_20px] border border-line bg-surface-2 px-4 py-3 text-[15px] leading-[1.4] font-medium">
          {item.text}
        </div>
      );
    case "kyra":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold tracking-[2.4px] text-gold">KYRA</span>
            {item.sources.length > 0 && (
              <span className="flex h-[22px] items-center rounded-[11px] border border-line px-2.5 text-[11px] font-medium text-muted">
                {item.sources.join(" · ")}
              </span>
            )}
          </div>
          <p className="font-serif text-[21px] leading-[1.3] font-medium whitespace-pre-line lining-nums">
            {item.text}
          </p>
        </div>
      );
    case "action":
      return (
        <div className="flex items-center gap-3 rounded-[20px] border border-kyra-line bg-kyra-bg px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kyra-icon-bg text-green">
            <CheckIcon size={20} strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold">{item.action.title}</span>
            <span className="text-[13px] font-medium text-muted tabular-nums">
              {item.action.detail}
            </span>
          </span>
        </div>
      );
    case "error":
      return (
        <div className="rounded-[20px] border border-warn/40 bg-warn-bg px-4 py-3 text-sm font-medium text-warn">
          {item.text}
        </div>
      );
  }
}
