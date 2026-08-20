"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ToolCard, type ToolCardData } from "../tool-card";

interface Tool extends ToolCardData {
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
      {/* Search + instant category filter (no page reload) */}
      <div className="mb-5 space-y-4">
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            className="input pl-10"
            placeholder="Hľadať náradie podľa názvu alebo modelu…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <p className="mb-4 text-sm text-slate-400">
        {filtered.length} {filtered.length === 1 ? "položka" : filtered.length >= 2 && filtered.length <= 4 ? "položky" : "položiek"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
          Pre zvolený filter nie je dostupné žiadne náradie.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <ToolCard key={t.slug} tool={t} />
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
