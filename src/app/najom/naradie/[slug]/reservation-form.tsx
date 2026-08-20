"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MonthCalendar } from "@/components/rental/month-calendar";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/format";

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function daysInclusive(a: string, b: string): number {
  const s = new Date(`${a}T00:00:00Z`).getTime();
  const e = new Date(`${b}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}

export function ReservationForm({
  toolId,
  dailyPrice,
  vatRate,
  minDays,
  unavailableDays,
  terms,
}: {
  toolId: string;
  toolName: string;
  dailyPrice: number;
  vatRate: number;
  pricePerKm: number;
  maxKm: number;
  minDays: number;
  unavailableDays: string[];
  terms: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const unavailable = useMemo(() => new Set(unavailableDays), [unavailableDays]);

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [delivery, setDelivery] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCompany: "",
    deliveryAddress: "",
    customerNote: "",
    website: "", // honeypot
  });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function rangeHasUnavailable(a: string, b: string): boolean {
    let cur = new Date(`${a}T00:00:00Z`).getTime();
    const e = new Date(`${b}T00:00:00Z`).getTime();
    while (cur <= e) {
      if (unavailable.has(new Date(cur).toISOString().slice(0, 10))) return true;
      cur += 86_400_000;
    }
    return false;
  }

  function onDayClick(day: string) {
    if (!start || (start && end)) {
      setStart(day);
      setEnd(null);
    } else {
      const [a, b] = day < start ? [day, start] : [start, day];
      if (rangeHasUnavailable(a, b)) {
        toast("Vo vybranom rozsahu je obsadený deň. Zvoľte iný termín.", "error");
        setStart(day);
        setEnd(null);
        return;
      }
      setStart(a);
      setEnd(b);
    }
  }

  const days = start ? daysInclusive(start, end ?? start) : 0;
  const price = useMemo(() => {
    if (!start) return null;
    const rental = r2(dailyPrice * days);
    const vat = r2((rental * vatRate) / 100);
    return { rental, vat, incl: r2(rental + vat) };
  }, [start, days, dailyPrice, vatRate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!start) return toast("Zvoľte termín v kalendári.", "error");
    if (days < minDays) return toast(`Minimálna doba prenájmu je ${minDays} dní.`, "error");
    if (!consent) return toast("Potvrďte súhlas so spracovaním údajov.", "error");
    if (delivery && !form.deliveryAddress.trim())
      return toast("Zadajte adresu dovozu.", "error");

    setSubmitting(true);
    const res = await fetch("/api/rental/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolId,
        startDate: start,
        endDate: end ?? start,
        ...form,
        deliveryType: delivery ? "DELIVERY" : "PICKUP",
        consent: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (res.ok && data.ok) {
      router.push(`/rezervacia/hotovo?c=${encodeURIComponent(data.number)}`);
    } else {
      toast(data.error ?? "Rezerváciu sa nepodarilo odoslať.", "error");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-navy">Rezervovať</h2>
        <div className="text-right">
          <span className="text-xl font-bold text-brand-dark">{formatCurrency(dailyPrice)}</span>
          <span className="block text-[11px] text-slate-400">za deň bez DPH</span>
        </div>
      </div>
      <p className="mb-3 text-sm text-slate-500">Vyberte termín a vyplňte kontaktné údaje. Rezerváciu potvrdíme e-mailom.</p>

      <div className="mb-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
        <MonthCalendar unavailable={unavailable} rangeStart={start} rangeEnd={end} onDayClick={onDayClick} />
      </div>
      <div className="mb-3 text-sm">
        {start ? (
          <span className="text-slate-700">
            Termín: <strong>{formatDate(start)}</strong> – <strong>{formatDate(end ?? start)}</strong> ({days} dní)
          </span>
        ) : (
          <span className="text-slate-400">Kliknite na začiatočný a koncový deň.</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input className="input" placeholder="Meno a priezvisko *" value={form.customerName} onChange={set("customerName")} required />
        <input className="input" placeholder="Firma (voliteľné)" value={form.customerCompany} onChange={set("customerCompany")} />
        <input type="email" className="input" placeholder="E-mail *" value={form.customerEmail} onChange={set("customerEmail")} required />
        <input className="input" placeholder="Telefón *" value={form.customerPhone} onChange={set("customerPhone")} required />
      </div>

      <label className="mt-2.5 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
        Mám záujem o dovoz na adresu
      </label>
      {delivery && (
        <div className="mt-2">
          <input className="input" placeholder="Adresa dovozu *" value={form.deliveryAddress} onChange={set("deliveryAddress")} />
          <p className="mt-1 text-xs text-slate-400">Cenu dopravy Vám doplníme a potvrdíme podľa vzdialenosti.</p>
        </div>
      )}

      <textarea className="input mt-2.5" rows={2} placeholder="Poznámka (voliteľné)" value={form.customerNote} onChange={set("customerNote")} />

      {/* Honeypot (hidden from users) */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        value={form.website}
        onChange={set("website")}
        aria-hidden
      />

      {price && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600"><span>Prenájom ({days} dní)</span><span>{formatCurrency(price.rental)}</span></div>
          <div className="flex justify-between text-slate-600"><span>DPH {vatRate} %</span><span>{formatCurrency(price.vat)}</span></div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-bold text-brand-navy">
            <span>Spolu s DPH</span><span>{formatCurrency(price.incl)}</span>
          </div>
          {delivery && <p className="mt-1 text-xs text-slate-400">+ dovoz (cena bude doplnená)</p>}
        </div>
      )}

      {terms && <p className="mt-2.5 whitespace-pre-wrap text-xs text-slate-400">{terms}</p>}

      <label className="mt-2.5 flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        Súhlasím so spracovaním osobných údajov na účely vybavenia rezervácie.
      </label>

      <button type="submit" className="btn-primary mt-3 w-full" disabled={submitting}>
        {submitting ? "Odosielam…" : "Odoslať rezerváciu"}
      </button>
    </form>
  );
}
