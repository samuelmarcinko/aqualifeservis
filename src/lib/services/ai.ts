import { getAiSettings } from "./settings";
import { decryptSecret } from "./crypto";

/**
 * AI assistant (Google Gemini). Turns free-form text or a voice recording from
 * the owner into structured, professional Slovak protocol fields. The model
 * only proposes values — the user reviews and saves.
 */

export interface AiWorkItem {
  description: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface AiProtocolDraft {
  faultType?: string;
  faultCause?: string;
  faultDescription?: string;
  damageExtent?: string;
  objectNote?: string;
  insurer?: string;
  insuranceContractNumber?: string;
  insuranceEventNumber?: string;
  faultDate?: string; // YYYY-MM-DD
  repairDate?: string; // YYYY-MM-DD
  technicianStatement?: string;
  notes?: string;
  recommendations?: string;
  workItems?: AiWorkItem[];
  transcript?: string;
}

const SYSTEM_INSTRUCTION = `Si odborný asistent slovenskej servisnej firmy AQUALIFE SERVIS s. r. o., ktorá sa zaoberá vodoinštalatérskymi opravami a riešením poistných udalostí (úniky vody, poruchy potrubí a pod.).

Dostaneš neusporiadaný text alebo prepis hlasového záznamu od technika/majiteľa o vykonanej oprave. Tvojou úlohou je:
1. Vytvoriť profesionálny, vecný a gramaticky správny SLOVENSKÝ text.
2. Rozdeliť informácie do polí protokolu podľa schémy.
3. Opraviť pravopis a štylistiku, formulovať odborne (ako skúsený vodoinštalatér).
4. NEVYMÝŠĽAJ fakty. Ak nejaký údaj v texte nie je, dané pole VYNECHAJ (nevracaj preň nič, ani "neuvedené").
5. Dátumy vracaj vo formáte RRRR-MM-DD, len ak sú v texte jednoznačne uvedené.
6. Do "workItems" rozpíš vykonané práce a použitý materiál ako samostatné položky (description povinné, quantity a unit len ak sú zrejmé, napr. "km", "ks", "hod.").
7. Do "transcript" vlož čistý prepis pôvodného textu (pri hlasovom zázname doslovný prepis).

Odpovedz VÝHRADNE platným JSON podľa poskytnutej schémy, bez ďalšieho komentára.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    faultType: { type: "string" },
    faultCause: { type: "string" },
    faultDescription: { type: "string" },
    damageExtent: { type: "string" },
    objectNote: { type: "string" },
    insurer: { type: "string" },
    insuranceContractNumber: { type: "string" },
    insuranceEventNumber: { type: "string" },
    faultDate: { type: "string" },
    repairDate: { type: "string" },
    technicianStatement: { type: "string" },
    notes: { type: "string" },
    recommendations: { type: "string" },
    workItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
        },
        required: ["description"],
      },
    },
    transcript: { type: "string" },
  },
} as const;

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

async function callGemini(parts: GeminiPart[]): Promise<AiProtocolDraft> {
  const ai = await getAiSettings();
  if (!ai.enabled) throw new Error("AI asistent je vypnutý v nastaveniach.");
  if (!ai.apiKeyEnc) throw new Error("Chýba API kľúč pre AI (nastavte ho v Nastaveniach).");
  const apiKey = decryptSecret(ai.apiKeyEnc);
  const model = ai.model || "gemini-2.5-flash";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.3,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message ?? "";
    } catch {
      /* ignore */
    }
    if (res.status === 400 && /API[_ ]?key|api key not valid/i.test(detail))
      throw new Error("Neplatný API kľúč pre AI.");
    if (res.status === 404)
      throw new Error(
        `Model „${model}" nie je dostupný pre tento kľúč. Skúste iný (napr. gemini-2.5-flash alebo gemini-1.5-flash). ${detail}`.trim(),
      );
    if (res.status === 429)
      throw new Error(
        `Kvóta/limit AI (429). Pri novom kľúči to zvyčajne znamená, že model „${model}" nemá na tomto projekte voľnú kvótu — skúste iný model alebo zapnite billing. Detail od Google: ${detail || "—"}`,
      );
    throw new Error(`AI služba zlyhala (${res.status}). ${detail}`.trim());
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  if (json.promptFeedback?.blockReason)
    throw new Error("AI zablokovala požiadavku (obsah).");

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("AI nevrátila žiadny výsledok.");

  let parsed: AiProtocolDraft;
  try {
    parsed = JSON.parse(text) as AiProtocolDraft;
  } catch {
    throw new Error("AI vrátila neplatný formát odpovede.");
  }
  return parsed;
}

export async function generateDraftFromText(text: string): Promise<AiProtocolDraft> {
  const trimmed = text.trim();
  if (trimmed.length < 3) throw new Error("Zadajte dlhší text.");
  return callGemini([{ text: `Text od technika:\n\n${trimmed}` }]);
}

export async function generateDraftFromAudio(
  base64: string,
  mimeType: string,
): Promise<AiProtocolDraft> {
  if (!base64) throw new Error("Chýba zvukový záznam.");
  return callGemini([
    { text: "Toto je hlasový záznam technika o vykonanej oprave. Prepíš ho a vytvor protokol." },
    { inlineData: { mimeType: mimeType || "audio/webm", data: base64 } },
  ]);
}
