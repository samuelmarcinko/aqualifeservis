"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";

export function ToolGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;

  const go = (dir: number) => setActive((i) => (i + dir + count) % count);

  // Touch swipe (used on the main image and in the lightbox).
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null;
    swiped.current = false;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null || count < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) {
      go(dx < 0 ? 1 : -1);
      swiped.current = true;
    }
    touchX.current = null;
  }

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
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-5xl">
        🧰
      </div>
    );
  }

  const main = images[active];

  return (
    <div>
      <div className="group relative">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            setLightbox(true);
          }}
          onKeyDown={(e) => e.key === "Enter" && setLightbox(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="product-frame block w-full cursor-zoom-in touch-pan-y select-none rounded-2xl border border-slate-200 p-5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main} alt={alt} className="pointer-events-none aspect-square w-full object-contain" draggable={false} />
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Predchádzajúca fotka"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-700 shadow-md ring-1 ring-slate-200 transition hover:bg-white active:scale-95"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Nasledujúca fotka"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-700 shadow-md ring-1 ring-slate-200 transition hover:bg-white active:scale-95"
            >
              ›
            </button>
            <div className="absolute right-3 top-3 rounded-full bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {active + 1} / {count}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`product-frame rounded-lg border-2 p-1 transition ${i === active ? "border-brand" : "border-slate-200 hover:border-slate-300"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} ${i + 1}`} className="aspect-square w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      <Modal open={lightbox} onClose={() => setLightbox(false)} size="xl" title={`${alt}${count > 1 ? ` (${active + 1}/${count})` : ""}`}>
        <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main} alt={alt} className="mx-auto max-h-[72vh] w-full select-none object-contain" draggable={false} />

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
