import { NextResponse } from "next/server";
import { publicReservationSchema } from "@/lib/validation";
import { createReservation } from "@/lib/services/rental";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Best-effort in-memory rate limit (per instance). Not perfect on serverless,
// but stops trivial floods; combined with the honeypot field.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Priveľa pokusov. Skúste o chvíľu." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný formát." }, { status: 400 });
  }

  const parsed = publicReservationSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Skontrolujte zadané údaje.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Honeypot: real users never fill this.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, number: "REZ-0000-0000" });
  }

  try {
    const r = await createReservation({
      toolId: parsed.data.toolId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      customerCompany: parsed.data.customerCompany,
      customerNote: parsed.data.customerNote,
      deliveryType: parsed.data.deliveryType,
      deliveryKm: parsed.data.deliveryKm ?? null,
      deliveryAddress: parsed.data.deliveryAddress,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });
    return NextResponse.json({ ok: true, number: r.number });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Rezerváciu sa nepodarilo vytvoriť." },
      { status: 400 },
    );
  }
}
