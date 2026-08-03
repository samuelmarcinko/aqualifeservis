"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";

export function ToolGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;

  const go = (dir: number) => setActive((i) => (i + dir + count) % count);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, count]);

  if (count === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-5xl">
        🧰
      </div>
    );
  }

  const main = images[active];

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

      {count > 1 && (
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

      <Modal open={lightbox} onClose={() => setLightbox(false)} size="xl" title={`${alt}${count > 1 ? ` (${active + 1}/${count})` : ""}`}>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main} alt={alt} className="mx-auto max-h-[72vh] w-full object-contain" />

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Predchádzajúca"
                className="absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-700 shadow hover:bg-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Nasledujúca"
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-700 shadow hover:bg-white"
              >
                ›
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`h-14 w-14 overflow-hidden rounded-lg border-2 ${i === active ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
