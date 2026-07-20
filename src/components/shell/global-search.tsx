"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: string;
  label: string;
  sublabel: string;
  href: string;
}

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { results: SearchResult[] };
          setResults(data.results);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <input
        className="input pl-9"
        placeholder="Hľadať zákazníka, ponuku, protokol…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />
      <svg
        className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      {open && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-cardhover">
          {loading && <div className="px-4 py-3 text-sm text-slate-400">Hľadám…</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">Žiadne výsledky</div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                setQ("");
                router.push(r.href);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
            >
              <span className="badge bg-brand/10 text-brand-dark">{r.type}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-slate-800">{r.label}</span>
                <span className="block text-xs text-slate-400">{r.sublabel}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
