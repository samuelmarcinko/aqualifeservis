import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { addProtocolPhoto } from "@/lib/services/photos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizované" }, { status: 401 });
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Chýba súbor." }, { status: 400 });
    }
    const result = await addProtocolPhoto(id, file, user.id);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Nahrávanie zlyhalo." },
      { status: 400 },
    );
  }
}
