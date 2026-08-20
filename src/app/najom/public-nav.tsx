"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Úvod" },
  { href: "/naradie", label: "Požičovňa náradia" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function PublicNav({ phone }: { phone?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-1 md:flex">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-brand/10 text-brand-dark" : "text-slate-600 hover:bg-slate-100 hover:text-brand-dark",
              )}
            >
              {l.label}
            </Link>
          );
        })}
        {telHref && (
          <a
            href={telHref}
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy"
          >
            <span aria-hidden>📞</span> {phone}
          </a>
        )}
      </nav>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
      >
        <span className="relative block h-4 w-5">
          <span className={cn("absolute left-0 h-0.5 w-5 bg-current transition-all", open ? "top-2 rotate-45" : "top-0")} />
          <span className={cn("absolute left-0 top-2 h-0.5 w-5 bg-current transition-all", open && "opacity-0")} />
          <span className={cn("absolute left-0 h-0.5 w-5 bg-current transition-all", open ? "top-2 -rotate-45" : "top-4")} />
        </span>
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute inset-x-0 top-full z-30 border-b border-slate-200 bg-white shadow-lg md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-brand/10 text-brand-dark" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
            {telHref && (
              <a
                href={telHref}
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white"
              >
                <span aria-hidden>📞</span> {phone}
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
