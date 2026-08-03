"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Úvod" },
  { href: "/naradie", label: "Požičovňa náradia" },
];

export function PublicNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {LINKS.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
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
    </nav>
  );
}
