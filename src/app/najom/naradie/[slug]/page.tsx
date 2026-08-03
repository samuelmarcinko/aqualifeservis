import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRentalSettings } from "@/lib/services/settings";
import { getUnavailableDays } from "@/lib/services/rental";
import { toDayISO } from "@/lib/services/rental-core";
import { formatCurrency } from "@/lib/format";
import { ReservationForm } from "./reservation-form";

export const dynamic = "force-dynamic";

export default async function RentalToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await prisma.rentalTool.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!tool || !tool.active) notFound();

  const settings = await getRentalSettings();
  const today = toDayISO(new Date());
  const to = toDayISO(new Date(Date.now() + 365 * 86_400_000));
  const unavailable = await getUnavailableDays(tool.id, today, to);

  const accessories = (tool.accessories ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div>
      <Link href={`/kategoria/${tool.category.slug}`} className="text-sm text-brand-dark hover:underline">
        ← {tool.category.name}
      </Link>

      <div className="mt-3 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex h-72 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {tool.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tool.imageUrl} alt={tool.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl">🧰</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-brand-navy">{tool.name}</h1>
          <div className="mt-1 text-xl font-bold text-brand-dark">
            {formatCurrency(tool.dailyPriceExVat)} <span className="text-sm font-normal text-slate-400">/ deň bez DPH</span>
          </div>
          {tool.description && <p className="mt-4 whitespace-pre-wrap text-slate-600">{tool.description}</p>}
          {accessories.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-brand-navy">Súčasťou prenájmu je:</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                {accessories.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 text-brand">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ReservationForm
          toolId={tool.id}
          toolName={tool.name}
          dailyPrice={Number(tool.dailyPriceExVat)}
          vatRate={Number(tool.vatRate)}
          pricePerKm={Number(settings.deliveryPricePerKm)}
          maxKm={settings.maxDeliveryKm}
          minDays={settings.minRentalDays}
          unavailableDays={unavailable}
          terms={settings.termsText ?? ""}
        />
      </div>
    </div>
  );
}
