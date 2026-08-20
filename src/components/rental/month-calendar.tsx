"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function todayISO(): string {
  return iso(new Date());
}

/** Monday-first weekday index (0=Mon .. 6=Sun). */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

export interface MonthCalendarProps {
  /** Days that cannot be selected (fully booked / past handled separately). */
  unavailable?: Set<string>;
  /** Reservation-occupied days (colored). */
  booked?: Set<string>;
  /** Manually blocked days (colored). */
  blocked?: Set<string>;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  onDayClick?: (isoDay: string) => void;
  /** Disable days before today. Default true. */
  disablePast?: boolean;
}

export function MonthCalendar({
  unavailable,
  booked,
  blocked,
  rangeStart,
  rangeEnd,
  onDayClick,
  disablePast = true,
}: MonthCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
  });

  const year = cursor.getUTCFullYear();
  const month = cursor.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = mondayIndex(first);
  const today = todayISO();

  const title = new Intl.DateTimeFormat("sk-SK", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);

  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(iso(new Date(Date.UTC(year, month, d))));
  while (cells.length % 7 !== 0) cells.push(null);

  function inRange(day: string): boolean {
    if (!rangeStart) return false;
    const end = rangeEnd ?? rangeStart;
    const [a, b] = rangeStart <= end ? [rangeStart, end] : [end, rangeStart];
    return day >= a && day <= b;
  }

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          onClick={() => setCursor(new Date(Date.UTC(year, month - 1, 1)))}
          aria-label="Predchádzajúci mesiac"
        >
          ‹
        </button>
        <div className="text-sm font-semibold capitalize text-brand-navy">{title}</div>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          onClick={() => setCursor(new Date(Date.UTC(year, month + 1, 1)))}
          aria-label="Nasledujúci mesiac"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-xs font-medium text-slate-400">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isPast = disablePast && day < today;
          const isUnavail = unavailable?.has(day) ?? false;
          const isBooked = booked?.has(day) ?? false;
          const isBlocked = blocked?.has(day) ?? false;
          const disabled = isPast || isUnavail;
          const selected = inRange(day);
          const isEndpoint = day === rangeStart || day === rangeEnd;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick?.(day)}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-lg text-sm transition",
                disabled && "cursor-not-allowed text-slate-300 line-through",
                !disabled && "hover:bg-brand/10",
                selected && "bg-brand/15",
                isEndpoint && "bg-brand-dark font-semibold text-white hover:bg-brand-dark",
                !disabled && !selected && !isEndpoint && "text-slate-700",
              )}
            >
              {Number(day.slice(8, 10))}
              {(isBooked || isBlocked) && !isEndpoint && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                    isBlocked ? "bg-slate-500" : "bg-amber-500",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
