"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight WYSIWYG editor built on contentEditable. Produces a small subset
 * of HTML (bold/italic/underline, headings, lists) which is sanitized again on
 * the server before it is stored. Legacy plain-text values (with newlines) are
 * converted to paragraphs on first load so nothing is lost.
 */

function plainTextToHtml(text: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${esc(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

interface ToolbarButton {
  label: string;
  title: string;
  command: string;
  value?: string;
  isActive?: () => boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  // Seed the editable region once from the incoming value.
  useEffect(() => {
    if (!ref.current) return;
    const initial = value
      ? /<[a-z][\s\S]*>/i.test(value)
        ? value
        : plainTextToHtml(value)
      : "";
    if (ref.current.innerHTML !== initial) ref.current.innerHTML = initial;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function exec(command: string, val?: string) {
    ref.current?.focus();
    // execCommand is deprecated but remains the pragmatic way to drive a small
    // contentEditable toolbar across browsers without a heavy dependency.
    document.execCommand(command, false, val);
    emit();
  }

  const isEmpty = !value || value.replace(/<[^>]*>/g, "").trim().length === 0;

  const buttons: ToolbarButton[] = [
    { label: "B", title: "Tučné", command: "bold" },
    { label: "I", title: "Kurzíva", command: "italic" },
    { label: "U", title: "Podčiarknuté", command: "underline" },
    { label: "H", title: "Nadpis", command: "formatBlock", value: "H3" },
    { label: "•", title: "Odrážky", command: "insertUnorderedList" },
    { label: "1.", title: "Číslovaný zoznam", command: "insertOrderedList" },
  ];

  return (
    <div className={cn("rounded-lg border border-slate-300 bg-white shadow-sm", focused && "ring-2 ring-brand/30")}>
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1.5">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(b.command, b.value)}
            className={cn(
              "h-7 min-w-[28px] rounded px-1.5 text-sm text-slate-600 hover:bg-slate-100",
              b.command === "bold" && "font-bold",
              b.command === "italic" && "italic",
              b.command === "underline" && "underline",
            )}
          >
            {b.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button
          type="button"
          title="Odstrániť formátovanie"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("removeFormat")}
          className="h-7 rounded px-2 text-xs text-slate-500 hover:bg-slate-100"
        >
          Vyčistiť
        </button>
      </div>
      <div className="relative">
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">{placeholder}</div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={() => {
            setFocused(false);
            emit();
          }}
          onFocus={() => setFocused(true)}
          className="rich-text min-h-[8rem] px-3 py-2 text-sm text-slate-800 focus:outline-none"
        />
      </div>
    </div>
  );
}
