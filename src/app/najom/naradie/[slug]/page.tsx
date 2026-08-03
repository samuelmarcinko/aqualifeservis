import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRentalSettings } from "@/lib/services/settings";
import { getUnavailableDays } from "@/lib/services/rental";
import { toDayISO } from "@/lib/services/rental-core";
import { formatCurrency } from "@/lib/format";
import { ReservationForm } from "./reservation-form";
import { PickupInfo } from "./pickup-info";
import { ToolGallery } from "./tool-gallery";
import { ToolMedia } from "./tool-media";

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

  const galleryUrls = ((tool.galleryPhotos as unknown as { url: string }[]) ?? []).map((p) => p.url);
  const images = [tool.imageUrl, ...galleryUrls].filter((u): u is string => !!u);
  const manuals = ((tool.manuals as unknown as { url: string; name?: string }[]) ?? []).map((m) => ({
    url: m.url,
    name: m.name ?? "Manuál.pdf",
  }));
  const videos = ((tool.videos as unknown as string[]) ?? []).filter(Boolean);

  return (
    <div>
      <Link href={`/kategoria/${tool.category.slug}`} className="text-sm text-brand-dark hover:underline">
        ← {tool.category.name}
      </Link>

      <div className="mt-3 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4">
            <ToolGallery images={images} alt={tool.name} />
          </div>
          <h1 className="text-2xl font-bold text-brand-navy">{tool.name}</h1>
          {tool.model && <p className="mt-0.5 text-base font-medium text-brand-dark">{tool.model}</p>}
          <div className="mt-2 text-xl font-bold text-brand-dark">
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

          <PickupInfo
            address={settings.pickupAddress?.trim() || "Strojnícka 20, 080 06 Prešov"}
            note={settings.pickupNote}
            mapEmbed={settings.pickupMapEmbed}
            photos={((settings.pickupPhotos as unknown as { url: string }[]) ?? []).map((p) => p.url)}
          />

          <ToolMedia videos={videos} manuals={manuals} />
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
