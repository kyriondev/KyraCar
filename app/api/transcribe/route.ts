import {
  GROQ_BASE_URL,
  GroqConfigError,
  groqErrorText,
  groqKey,
  sttModel,
  userMessageForStatus,
} from "@/lib/kyra/groq";

const MAX_BYTES = 10 * 1024 * 1024;

function extensionFor(type: string): string {
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  return "webm";
}

export async function POST(request: Request) {
  let audio: FormDataEntryValue | null;
  try {
    audio = (await request.formData()).get("audio");
  } catch {
    return Response.json({ error: "Neplatný požadavek." }, { status: 400 });
  }
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "Nahrávka je prázdná." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return Response.json({ error: "Nahrávka je moc dlouhá." }, { status: 413 });
  }

  try {
    const form = new FormData();
    // Groq reads the container from the file name, so it must match the recorder's format.
    form.append("file", audio, `audio.${extensionFor(audio.type)}`);
    form.append("model", sttModel());
    form.append("language", "cs");
    form.append("response_format", "json");
    form.append("temperature", "0");

    const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey()}` },
      body: form,
    });
    if (!res.ok) {
      console.error(`Groq STT ${res.status}:`, await groqErrorText(res));
      return Response.json({ error: userMessageForStatus(res.status) }, { status: 502 });
    }
    const data = await res.json();
    return Response.json({ text: String(data?.text ?? "").trim() });
  } catch (error) {
    if (error instanceof GroqConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("Transcribe route error:", error);
    return Response.json({ error: "Přepis se nepovedl. Zkus to znovu." }, { status: 502 });
  }
}
