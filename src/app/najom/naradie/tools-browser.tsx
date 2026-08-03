"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Tool {
  slug: string;
  name: string;
  model: string | null;
  description: string | null;
  imageUrl: string | null;
  dailyPriceExVat: string;
  categorySlug: string;
}

export function ToolsBrowser({
  initialCat,
  categories,
  tools,
}: {
  initialCat: string;
  categories: { slug: string; name: string }[];
  tools: Tool[];
}) {
  const [cat, setCat] = useState(initialCat);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (cat !== "all" && t.categorySlug !== cat) return false;
      if (q && !`${t.name} ${t.model ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tools, cat, query]);

  return (
    <div>
      {/* Instant category filter (no page reload) */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          Všetko ({tools.length})
        </Chip>
        {categories.map((c) => {
          const count = tools.filter((t) => t.categorySlug === c.slug).length;
          return (
            <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
              {c.name} ({count})
            </Chip>
          );
        })}
      </div>

      <div className="mb-6 max-w-sm">
        <input
          className="input"
          placeholder="Hľadať náradie…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          Pre zvolený filter nie je dostupné žiadne náradie.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Link
              key={t.slug}
              href={`/naradie/${t.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:shadow-cardhover"
            >
              <div className="flex aspect-square items-center justify-center overflow-hidden bg-slate-100">
                {t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <span className="text-4xl">🧰</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold text-brand-navy group-hover:text-brand-dark">{t.name}</h3>
                {t.model && <p className="text-xs font-medium text-brand">{t.model}</p>}
                {t.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>}
                <div className="mt-auto pt-3">
                  <span className="text-lg font-bold text-brand-dark">{formatCurrency(t.dailyPriceExVat)}</span>
                  <span className="text-sm text-slate-400"> / deň bez DPH</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium transition",
        active ? "bg-brand-dark text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {children}
    </button>
  );
}
