"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Úvod", exact: true },
  { href: "/naradie", label: "Požičovňa náradia" },
  { href: "/#ako-to-funguje", label: "Ako to funguje", anchor: true },
  { href: "/#o-nas", label: "O nás", anchor: true },
  { href: "/#kontakt", label: "Kontakt", anchor: true },
];

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1l-2.1 2.2Z" />
    </svg>
  );
}

export function PublicNav({ phone }: { phone?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

  const active = (l: (typeof LINKS)[number]) =>
    l.anchor ? false : l.exact ? pathname === l.href : pathname.startsWith(l.href);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-6 lg:flex">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "border-b-2 pb-0.5 text-sm font-medium transition",
              active(l)
                ? "border-brand-dark text-brand-dark"
                : "border-transparent text-slate-600 hover:text-brand-dark",
            )}
          >
            {l.label}
          </Link>
        ))}
        {telHref && (
          <a
            href={telHref}
            className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <PhoneIcon className="h-4 w-4" /> {phone}
          </a>
        )}
      </nav>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
      >
        <span className="relative block h-4 w-5">
          <span className={cn("absolute left-0 h-0.5 w-5 bg-current transition-all", open ? "top-2 rotate-45" : "top-0")} />
          <span className={cn("absolute left-0 top-2 h-0.5 w-5 bg-current transition-all", open && "opacity-0")} />
          <span className={cn("absolute left-0 h-0.5 w-5 bg-current transition-all", open ? "top-2 -rotate-45" : "top-4")} />
        </span>
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute inset-x-0 top-full z-30 border-b border-slate-200 bg-white shadow-lg lg:hidden">
          <div className="mx-auto max-w-[1400px] space-y-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active(l) ? "bg-brand/10 text-brand-dark" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {l.label}
              </Link>
            ))}
            {telHref && (
              <a
                href={telHref}
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-full bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white"
              >
                <PhoneIcon className="h-4 w-4" /> {phone}
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
