import { getCurrentUser } from "@/lib/session";
import { generateQuotationPreview } from "@/lib/services/quotations";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Neautorizované", { status: 401 });
  const { id } = await params;
  const q = await prisma.quotation.findUnique({ where: { id }, select: { number: true } });
  if (!q) return new Response("Nenájdené", { status: 404 });

  const pdf = await generateQuotationPreview(id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${q.number}-nahlad.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
