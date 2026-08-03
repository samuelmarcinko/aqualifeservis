"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";

export function ToolGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const main = images[active];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-5xl">
        🧰
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} className="aspect-square w-full object-cover" />
      </button>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-lg border-2 ${i === active ? "border-brand" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} ${i + 1}`} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Modal open={lightbox} onClose={() => setLightbox(false)} size="xl" title={alt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} className="max-h-[75vh] w-full object-contain" />
      </Modal>
    </div>
  );
}
