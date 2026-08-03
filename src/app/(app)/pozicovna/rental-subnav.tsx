"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/pozicovna", label: "Rezervácie" },
  { href: "/pozicovna/naradie", label: "Náradie" },
  { href: "/pozicovna/kalendar", label: "Kalendár" },
  { href: "/pozicovna/nastavenia", label: "Nastavenia" },
];

export function RentalSubnav({ pending }: { pending?: number }) {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition",
              active
                ? "border-brand-dark text-brand-dark"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {t.label}
            {t.href === "/pozicovna" && pending ? (
              <span className="badge bg-amber-100 text-amber-800">{pending}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
