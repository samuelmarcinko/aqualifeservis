"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";

export function PickupInfo({
  address,
  note,
  mapEmbed,
  photos,
}: {
  address: string;
  note: string | null;
  mapEmbed: string | null;
  photos: string[];
}) {
  const [open, setOpen] = useState(false);
  const mapSrc =
    mapEmbed?.trim() ||
    `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 flex w-full items-center justify-between rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-left text-sm font-medium text-brand-dark transition hover:bg-brand/10"
      >
        <span className="flex items-center gap-2">
          <span>📍</span> Kde si môžete prevziať náradie?
        </span>
        <span>→</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Miesto prevzatia náradia" size="lg">
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">📍</span>
            <div>
              <div className="font-semibold text-brand-navy">{address}</div>
              {note && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{note}</p>}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <iframe
              title="Mapa – miesto prevzatia"
              src={mapSrc}
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt={`Miesto prevzatia ${i + 1}`} className="h-32 w-full rounded-lg object-cover" />
              ))}
            </div>
          )}

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary inline-flex"
          >
            Otvoriť v Google Maps
          </a>
        </div>
      </Modal>
    </>
  );
}
