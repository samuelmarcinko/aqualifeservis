"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { AiProtocolDraft } from "@/lib/services/ai";
import { aiDraftFromText, aiDraftFromAudio } from "./actions";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(",") + 1)); // strip data: prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function ProtocolAiAssistant({ onApply }: { onApply: (draft: AiProtocolDraft) => void }) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<null | "text" | "audio">(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function handleResult(res: { ok: boolean; data?: AiProtocolDraft; error?: string }) {
    if (res.ok && res.data) {
      onApply(res.data);
      if (res.data.transcript && !text.trim()) setText(res.data.transcript);
      toast("Polia predvyplnené AI. Skontrolujte a upravte podľa potreby.", "success");
    } else {
      toast(res.error ?? "AI zlyhala.", "error");
    }
  }

  async function fromText() {
    if (!text.trim()) return toast("Zadajte text.", "error");
    setBusy("text");
    const res = await aiDraftFromText({ text });
    setBusy(null);
    handleResult(res);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setBusy("audio");
        try {
          const base64 = await blobToBase64(blob);
          const res = await aiDraftFromAudio({ data: base64, mimeType: blob.type || "audio/webm" });
          handleResult(res);
        } catch {
          toast("Spracovanie záznamu zlyhalo.", "error");
        } finally {
          setBusy(null);
        }
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch {
      toast("Nepodarilo sa spustiť mikrofón (povoľte prístup).", "error");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  const disabled = busy !== null || recording;

  return (
    <div className="card border-brand/30 bg-brand/5 p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
          AI asistent – vyplnenie protokolu
        </h2>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Nadiktujte alebo vložte voľný text (čo sa robilo, príčina, materiál…). AI z toho vytvorí
        profesionálne texty a predvyplní polia protokolu. Výsledok si vždy skontrolujte.
      </p>

      <textarea
        className="input"
        rows={4}
        placeholder="Napr.: Klient nás oslovil že mu spod podlahy vyteká voda, spravili sme tlakovú skúšku, termokamerou sme našli únik pri vani, poškodený sifón, opravené, doprava 20 km…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" onClick={fromText} disabled={disabled || !text.trim()}>
          {busy === "text" ? "Spracúvam…" : "✨ Vyplniť z textu"}
        </button>

        {!recording ? (
          <button type="button" className="btn-secondary" onClick={startRecording} disabled={disabled}>
            🎤 Nadiktovať
          </button>
        ) : (
          <button type="button" className="btn-danger" onClick={stopRecording}>
            ⏹ Zastaviť nahrávanie
          </button>
        )}

        {recording && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" /> Nahrávam…
          </span>
        )}
        {busy === "audio" && <span className="text-sm text-slate-500">Prepisujem záznam…</span>}
      </div>
    </div>
  );
}
