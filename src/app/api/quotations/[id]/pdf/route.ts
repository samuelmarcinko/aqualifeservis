import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { fetchStoredPdf } from "@/lib/services/email";

export const dynamic = "force-dynamic";

/** Stream a stored (finalized) quotation PDF for a given revision. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Neautorizované", { status: 401 });
  const { id } = await params;
  const revisionParam = new URL(req.url).searchParams.get("revision");

  const where = revisionParam
    ? { quotationId_revision: { quotationId: id, revision: Number(revisionParam) } }
    : undefined;

  const revision = where
    ? await prisma.quotationRevision.findUnique({ where, include: { storedDocument: true } })
    : await prisma.quotationRevision.findFirst({
        where: { quotationId: id },
        orderBy: { revision: "desc" },
        include: { storedDocument: true },
      });

  if (!revision?.storedDocument) return new Response("PDF nenájdené", { status: 404 });

  const pdf = await fetchStoredPdf(revision.storedDocument.blobUrl);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${revision.storedDocument.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
