import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { customerDisplayName } from "@/lib/snapshots";
import { QUOTATION_STATUS_LABELS, PROTOCOL_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizované" }, { status: 401 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const like = { contains: q, mode: "insensitive" as const };

  const [customers, quotations, protocols] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { firstName: like },
          { lastName: like },
          { businessName: like },
          { contactPerson: like },
          { email: like },
          { phone: like },
          { ico: like },
        ],
      },
      take: 6,
    }),
    prisma.quotation.findMany({ where: { number: like }, take: 5, include: { customer: true } }),
    prisma.repairProtocol.findMany({ where: { number: like }, take: 5, include: { customer: true } }),
  ]);

  const results = [
    ...customers.map((c) => ({
      type: "Zákazník",
      label: customerDisplayName(c),
      sublabel: [c.email, c.phone].filter(Boolean).join(" · ") || "—",
      href: `/zakaznici/${c.id}`,
    })),
    ...quotations.map((qq) => ({
      type: "Ponuka",
      label: qq.number,
      sublabel: `${customerDisplayName(qq.customer)} · ${QUOTATION_STATUS_LABELS[qq.status]}`,
      href: `/cenove-ponuky/${qq.id}`,
    })),
    ...protocols.map((p) => ({
      type: "Protokol",
      label: p.number,
      sublabel: `${customerDisplayName(p.customer)} · ${PROTOCOL_STATUS_LABELS[p.status]}`,
      href: `/protokoly/${p.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
