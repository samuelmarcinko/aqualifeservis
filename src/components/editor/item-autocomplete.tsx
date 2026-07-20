"use client";

import { useEffect, useRef, useState } from "react";

export interface Suggestion {
  source: string;
  name: string;
  typeLabel: string;
  defaultUnit: string;
  defaultPrice: string | null;
  lastUsedPrice: string | null;
  vatRate: string | null;
  usageCount: number;
  catalogItemId?: string;
}

export function ItemAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: Suggestion) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/suggestions?q=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions);
        setOpen(data.suggestions.length > 0);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full min-w-[280px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-cardhover">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                skip.current = true;
                onSelect(s);
                setOpen(false);
              }}
              className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
            >
              <span>
                <span className="block text-sm font-medium text-slate-800">{s.name}</span>
                <span className="block text-xs text-slate-400">
                  {s.typeLabel} · {s.defaultUnit}
                  {s.usageCount > 0 ? ` · ${s.usageCount}×` : ""}
                </span>
              </span>
              <span className="whitespace-nowrap text-xs text-slate-500">
                {s.lastUsedPrice ?? s.defaultPrice
                  ? `${s.lastUsedPrice ?? s.defaultPrice} €`
                  : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
