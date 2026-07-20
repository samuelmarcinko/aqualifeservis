import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getItemSuggestions } from "@/lib/services/suggestions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizované" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const suggestions = await getItemSuggestions(q);
  return NextResponse.json({ suggestions });
}
