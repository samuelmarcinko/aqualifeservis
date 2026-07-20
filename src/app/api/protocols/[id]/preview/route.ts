import { getCurrentUser } from "@/lib/session";
import { generateProtocolPreview } from "@/lib/services/protocols";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Neautorizované", { status: 401 });
  const { id } = await params;
  const p = await prisma.repairProtocol.findUnique({ where: { id }, select: { number: true } });
  if (!p) return new Response("Nenájdené", { status: 404 });

  const pdf = await generateProtocolPreview(id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${p.number}-nahlad.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
