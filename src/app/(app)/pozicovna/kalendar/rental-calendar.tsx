"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MonthCalendar } from "@/components/rental/month-calendar";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import { createBlockAction, deleteBlockAction } from "../actions";

interface Booking {
  id: string;
  startISO: string;
  endISO: string;
  type: string;
  note: string | null;
  reservationNumber: string | null;
  customerName: string | null;
}

function daysBetween(a: string, b: string): string[] {
  const out: string[] = [];
  let cur = new Date(`${a}T00:00:00Z`).getTime();
  const end = new Date(`${b}T00:00:00Z`).getTime();
  while (cur <= end) {
    out.push(new Date(cur).toISOString().slice(0, 10));
    cur += 86_400_000;
  }
  return out;
}

export function RentalCalendar({
  tools,
  selectedToolId,
  bookings,
}: {
  tools: { id: string; name: string; quantity: number }[];
  selectedToolId: string;
  bookings: Booking[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const { bookedSet, blockedSet } = useMemo(() => {
    const booked = new Set<string>();
    const blocked = new Set<string>();
    for (const b of bookings) {
      const days = daysBetween(b.startISO, b.endISO);
      for (const d of days) (b.type === "BLOCK" ? blocked : booked).add(d);
    }
    return { bookedSet: booked, blockedSet: blocked };
  }, [bookings]);

  function onDayClick(day: string) {
    if (!start || (start && end)) {
      setStart(day);
      setEnd(null);
    } else {
      if (day < start) {
        setEnd(start);
        setStart(day);
      } else setEnd(day);
    }
  }

  async function block() {
    if (!start) return;
    setSaving(true);
    const res = await createBlockAction({
      toolId: selectedToolId,
      startDate: start,
      endDate: end ?? start,
      note: note || undefined,
    });
    setSaving(false);
    if (res.ok) {
      toast("Termín zablokovaný.", "success");
      setStart(null);
      setEnd(null);
      setNote("");
      router.refresh();
    } else toast(res.error, "error");
  }

  async function removeBlock() {
    if (!delId) return;
    const res = await deleteBlockAction(delId);
    if (res.ok) {
      toast("Blokácia odstránená.", "success");
      router.refresh();
    } else toast(res.error, "error");
    setDelId(null);
  }

  const manualBlocks = bookings.filter((b) => b.type === "BLOCK");

  if (tools.length === 0) {
    return <div className="card p-8 text-center text-sm text-slate-400">Najprv pridajte náradie.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <label className="label">Náradie</label>
        <select
          className="input mb-4"
          value={selectedToolId}
          onChange={(e) => router.push(`/pozicovna/kalendar?tool=${e.target.value}`)}
        >
          {tools.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.quantity} ks)
            </option>
          ))}
        </select>

        <MonthCalendar
          booked={bookedSet}
          blocked={blockedSet}
          rangeStart={start}
          rangeEnd={end}
          onDayClick={onDayClick}
          disablePast={false}
        />

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Rezervácia</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Blokované</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="mb-2 text-sm font-semibold text-brand-navy">Manuálne blokovanie</h3>
          <p className="mb-3 text-xs text-slate-400">
            Vyberte termín v kalendári (klik na začiatok a koniec) – napr. servis alebo vlastné použitie.
          </p>
          <div className="mb-3 text-sm text-slate-600">
            {start ? (
              <>Vybrané: <strong>{formatDate(start)}</strong>{end ? <> – <strong>{formatDate(end)}</strong></> : ""}</>
            ) : (
              "Zatiaľ nič nevybrané"
            )}
          </div>
          <input
            className="input mb-2"
            placeholder="Poznámka (napr. servis)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="btn-primary w-full" onClick={block} disabled={!start || saving}>
            {saving ? "Ukladám…" : "Zablokovať termín"}
          </button>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-brand-navy">Obsadené termíny</h3>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400">Žiadne obsadené termíny.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">
                      {formatDate(b.startISO)} – {formatDate(b.endISO)}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {b.type === "BLOCK"
                        ? `Blokované${b.note ? ` · ${b.note}` : ""}`
                        : `Rezervácia ${b.reservationNumber ?? ""}${b.customerName ? ` · ${b.customerName}` : ""}`}
                    </span>
                  </div>
                  {b.type === "BLOCK" && (
                    <button className="text-xs text-red-500 hover:underline" onClick={() => setDelId(b.id)}>
                      Odblokovať
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!delId}
        title="Odblokovať termín?"
        message="Termín sa opäť uvoľní."
        confirmLabel="Odblokovať"
        onConfirm={removeBlock}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
}
