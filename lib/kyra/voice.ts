// Speech in and out: transcription via /api/transcribe, replies via speechSynthesis.

export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, "audio");
  let res: Response;
  try {
    res = await fetch("/api/transcribe", { method: "POST", body: form });
  } catch {
    throw new Error("Nejsem online. Zkontroluj připojení.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Přepis se nepovedl.");
  return String(data.text ?? "");
}

export function speak(text: string) {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "cs-CZ";
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("cs"));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}
