import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRentalSettings } from "@/lib/services/settings";
import { getUnavailableDays } from "@/lib/services/rental";
import { toDayISO } from "@/lib/services/rental-core";
import { formatCurrency } from "@/lib/format";
import { sanitizeRichText, looksLikeHtml } from "@/lib/sanitize";
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
    include: {
      category: true,
      accessoryGroups: {
        where: { active: true },
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          options: {
            where: { active: true },
            orderBy: [{ position: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });
  if (!tool || !tool.active) notFound();

  const accessoryGroups = tool.accessoryGroups
    .filter((g) => g.options.length > 0)
    .map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        imageUrl: o.imageUrl,
        dailyPriceExVat: Number(o.dailyPriceExVat),
      })),
    }));

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
  const hasMedia = videos.length > 0 || manuals.length > 0;

  return (
    <div>
      <Link
        href={`/naradie?cat=${tool.category.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-dark"
      >
        <span aria-hidden>←</span> {tool.category.name}
      </Link>

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        {/* ── A: galéria + identita ───────────────────────────── */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ToolGallery images={images} alt={tool.name} />

          <div className="mt-6">
            <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              {tool.category.name}
            </span>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-brand-navy sm:text-3xl">{tool.name}</h1>
            {tool.model && <p className="mt-1 text-base font-medium text-brand-dark">{tool.model}</p>}
            <div className="mt-4 flex items-end gap-2">
              <span className="text-3xl font-bold text-brand-navy">{formatCurrency(tool.dailyPriceExVat)}</span>
              <span className="pb-1 text-sm font-normal text-slate-400">/ deň bez DPH</span>
            </div>
          </div>
        </div>

        {/* ── B: rezervácia (na mobile hneď pod fotkou; desktop sticky vpravo) ── */}
        <aside
          id="rezervacia"
          className="mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-0.5"
        >
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
            accessoryGroups={accessoryGroups}
          />
        </aside>

        {/* ── C: popis, príslušenstvo, prevzatie, médiá ───────── */}
        <div className="mt-8 min-w-0 lg:col-start-1 lg:row-start-2">
          {tool.description && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-brand-navy">Popis</h2>
              {looksLikeHtml(tool.description) ? (
                <div
                  className="rich-text text-[15px] leading-relaxed text-slate-600"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(tool.description) }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-600">{tool.description}</p>
              )}
            </section>
          )}

          {accessories.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-brand-navy">Súčasťou prenájmu je</h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {accessories.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm text-slate-700"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand-dark">
                      ✓
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8">
            <PickupInfo
              address={settings.pickupAddress?.trim() || "Strojnícka 20, 080 06 Prešov"}
              note={settings.pickupNote}
              mapEmbed={settings.pickupMapEmbed}
              photos={((settings.pickupPhotos as unknown as { url: string }[]) ?? []).map((p) => p.url)}
            />
          </div>

          {hasMedia && (
            <section className="mt-8">
              <h2 className="mb-1 text-lg font-semibold text-brand-navy">Videá a dokumenty</h2>
              <ToolMedia videos={videos} manuals={manuals} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
