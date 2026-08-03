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

const BASE_SYSTEM_INSTRUCTION = `Si skúsený servisný technik a vodoinštalatér firmy AQUALIFE SERVIS s. r. o. Špecializuješ sa na vodoinštalatérske opravy, čistenie a monitoring kanalizácií, lokalizáciu porúch a únikov vody a na riešenie poistných udalostí.

Dostaneš neusporiadaný text alebo prepis hlasového záznamu od technika o vykonanej oprave. Tvojou úlohou je vytvoriť odbornú dokumentáciu – protokol o oprave, ktorý slúži aj ako PODKLAD PRE POISŤOVŇU.

ŠTÝL A JAZYK:
- Píš vecne, odborne a profesionálne v spisovnej SLOVENČINE, ako skúsený vodoinštalatér.
- Používaj odbornú terminológiu odboru: menovité priemery (DN), rozvody studenej (SV) a teplej (TÚV) vody, stúpačka, ležatý/zvislý rozvod, sifón, tlaková skúška, skúška formovacím/tvárniacim plynom, termovízia/termokamera, lokalizácia úniku, korózia, netesnosť, prasknutie, upchatie, spätný ventil, tvarovka, lisovaný/PPR spoj a pod. – ale len tam, kde to zodpovedá vstupu.
- Formuluj jasne a jednoznačne, žiadne hovorové výrazy, skratky ani preklepy. Vety musia byť zrozumiteľné aj pre pracovníka poisťovne bez technického vzdelania.

OBSAH A ROZSAH:
- "faultType": stručne a odborne (1 veta / menný výraz).
- "faultCause": jasne pomenovaná príčina poruchy (1–2 vety).
- "faultDescription": podrobný, chronologický popis poruchy a diagnostiky – postup od nahlásenia cez použité metódy (tlakové skúšky, termokamera, lokalizácia) až po zistenie (3–6 viet).
- "damageExtent": vecný rozsah poškodenia (zasiahnuté konštrukcie, priestory, potrubie) – 1–3 vety.
- "technicianStatement": odborné zhrnutie vykonaného zásahu a výsledku (2–4 vety).
- "recommendations": konkrétne odborné odporúčania (napr. vysušenie odvlhčovačom, výmena rozvodu, kontrola) – 1–3 vety.
- Ostatné polia stručne a vecne.

PRAVIDLÁ:
- NEVYMÝŠĽAJ fakty ani čísla. Čo nie je vo vstupe, to VYNECHAJ (nevracaj pole, ani "neuvedené").
- Dátumy vracaj vo formáte RRRR-MM-DD, len ak sú vo vstupe jednoznačne uvedené.
- Do "workItems" rozpíš vykonané práce a použitý materiál ako samostatné položky (description povinné; quantity a unit len ak sú zrejmé, napr. "ks", "m", "hod.", "km").
- Do "transcript" vlož čistý prepis pôvodného vstupu (pri hlasovom zázname doslovný prepis).

Odpovedz VÝHRADNE platným JSON podľa poskytnutej schémy, bez akéhokoľvek ďalšieho komentára.`;

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
  const model = ai.model || "gemini-flash-latest";

  const systemText = ai.instructions?.trim()
    ? `${BASE_SYSTEM_INSTRUCTION}\n\nĎALŠIE POKYNY OD PREVÁDZKOVATEĽA (majú prednosť pri štýle a terminológii):\n${ai.instructions.trim()}`
    : BASE_SYSTEM_INSTRUCTION;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
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
