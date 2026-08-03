"use client";

import { useState } from "react";

function ytId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

export function ToolMedia({
  videos,
  manuals,
}: {
  videos: string[];
  manuals: { url: string; name: string }[];
}) {
  const hasVideos = videos.length > 0;
  const hasManuals = manuals.length > 0;
  const [tab, setTab] = useState<"videos" | "manuals">(hasVideos ? "videos" : "manuals");

  if (!hasVideos && !hasManuals) return null;

  return (
    <div className="mt-6">
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {hasVideos && (
          <button
            onClick={() => setTab("videos")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === "videos" ? "border-brand-dark text-brand-dark" : "border-transparent text-slate-500"}`}
          >
            Videá
          </button>
        )}
        {hasManuals && (
          <button
            onClick={() => setTab("manuals")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === "manuals" ? "border-brand-dark text-brand-dark" : "border-transparent text-slate-500"}`}
          >
            Manuály
          </button>
        )}
      </div>

      {tab === "videos" && hasVideos && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map((v, i) => {
            const id = ytId(v);
            return id ? (
              <div key={i} className="aspect-video overflow-hidden rounded-lg border border-slate-200">
                <iframe
                  src={`https://www.youtube.com/embed/${id}`}
                  title={`Video ${i + 1}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a key={i} href={v} target="_blank" rel="noreferrer" className="text-sm text-brand-dark hover:underline">
                {v}
              </a>
            );
          })}
        </div>
      )}

      {tab === "manuals" && hasManuals && (
        <div className="space-y-2">
          {manuals.map((m) => (
            <a
              key={m.url}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand-dark"
            >
              <span className="text-lg">📄</span>
              {m.name}
              <span className="ml-auto text-xs text-slate-400">Stiahnuť PDF →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
