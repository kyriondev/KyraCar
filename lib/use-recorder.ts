"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording";

// iOS Safari records audio/mp4 only; Chromium and Firefox prefer webm/opus.
const MIME_TYPES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Microphone recording through MediaRecorder (Web Speech recognition is unreliable
 * in iOS home-screen apps). `level` is 0–1 loudness for the waveform bars.
 */
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [level, setLevel] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const frame = useRef<number | undefined>(undefined);
  const resolveStop = useRef<((blob: Blob | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioContext.current?.close().catch(() => {});
    audioContext.current = null;
    recorder.current = null;
    setLevel(0);
    setStatus("idle");
  }, []);

  useEffect(() => cleanup, [cleanup]);

  /** Throws with a Czech message when the microphone isn't available. */
  const start = useCallback(async () => {
    if (recorder.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("Tenhle prohlížeč neumí nahrávat zvuk.");
    }
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error("Mikrofon není povolený. Povol ho v nastavení prohlížeče.");
    }
    stream.current = media;

    const mimeType = pickMimeType();
    const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
    chunks.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    rec.onstop = () => {
      const type = rec.mimeType || mimeType || "audio/webm";
      const blob = chunks.current.length ? new Blob(chunks.current, { type }) : null;
      cleanup();
      resolveStop.current?.(blob);
      resolveStop.current = null;
    };
    recorder.current = rec;
    // A timeslice makes Safari write a playable MP4 instead of a broken single chunk.
    rec.start(1000);
    setStatus("recording");

    try {
      const ctx = new AudioContext();
      audioContext.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        frame.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // The level meter is cosmetic; recording works without it.
    }
  }, [cleanup]);

  /** Stops and resolves with the recording, or null when nothing was captured. */
  const stop = useCallback((): Promise<Blob | null> => {
    const rec = recorder.current;
    if (!rec || rec.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      resolveStop.current = resolve;
      rec.stop();
    });
  }, []);

  return { status, level, start, stop };
}
