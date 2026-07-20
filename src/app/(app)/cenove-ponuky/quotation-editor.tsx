"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { ItemAutocomplete, type Suggestion } from "@/components/editor/item-autocomplete";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_UNITS, VAT_RATES, TAX_MODE_LABELS, CATALOG_TYPE_LABELS } from "@/lib/constants";
import { saveQuotation } from "./actions";
import { createCatalogItem } from "../katalog/actions";

interface CustomerOption {
  id: string;
  name: string;
  addresses: { id: string; label: string }[];
}

interface LineItem {
  key: string;
  description: string;
  detail: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountPct: string;
  vatRate: string;
  catalogItemId?: string;
}

export interface QuotationEditorInitial {
  id: string;
  customerId: string;
  serviceAddressId: string | null;
  issueDate: string;
  validUntil: string;
  taxMode: string;
  noVatNote: string | null;
  documentDiscountType: string;
  documentDiscountValue: string;
  internalNote: string | null;
  customerNote: string | null;
  items: {
    description: string;
    detail: string | null;
    quantity: string;
    unit: string;
    unitPrice: string;
    discountPct: string;
    vatRate: string;
    catalogItemId: string | null;
  }[];
}

function newLine(vat: number): LineItem {
  return {
    key: Math.random().toString(36).slice(2),
    description: "",
    detail: "",
    quantity: "1",
    unit: "ks",
    unitPrice: "0",
    discountPct: "0",
    vatRate: String(vat),
  };
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function QuotationEditor({
  customers,
  defaultVatRate,
  validityDays,
  preselectCustomerId,
  initial,
}: {
  customers: CustomerOption[];
  defaultVatRate: number;
  validityDays: number;
  preselectCustomerId?: string;
  initial?: QuotationEditorInitial;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [catalogModal, setCatalogModal] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const defaultValid = new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10);

  const [customerId, setCustomerId] = useState(initial?.customerId ?? preselectCustomerId ?? "");
  const [serviceAddressId, setServiceAddressId] = useState(initial?.serviceAddressId ?? "");
  const [issueDate, setIssueDate] = useState(initial?.issueDate?.slice(0, 10) ?? today);
  const [validUntil, setValidUntil] = useState(initial?.validUntil?.slice(0, 10) ?? defaultValid);
  const [taxMode, setTaxMode] = useState(initial?.taxMode ?? "STANDARD");
  const [noVatNote, setNoVatNote] = useState(initial?.noVatNote ?? "");
  const [discountType, setDiscountType] = useState(initial?.documentDiscountType ?? "NONE");
  const [discountValue, setDiscountValue] = useState(initial?.documentDiscountValue ?? "0");
  const [internalNote, setInternalNote] = useState(initial?.internalNote ?? "");
  const [customerNote, setCustomerNote] = useState(initial?.customerNote ?? "");
  const [items, setItems] = useState<LineItem[]>(
    initial
      ? initial.items.map((i) => ({
          key: Math.random().toString(36).slice(2),
          description: i.description,
          detail: i.detail ?? "",
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          discountPct: i.discountPct,
          vatRate: i.vatRate,
          catalogItemId: i.catalogItemId ?? undefined,
        }))
      : [newLine(defaultVatRate)],
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const totals = useMemo(() => {
    const standard = taxMode === "STANDARD";
    const lineNets = items.map((it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.unitPrice) || 0;
      const d = Number(it.discountPct) || 0;
      return r2(q * p * (1 - d / 100));
    });
    const subtotal = r2(lineNets.reduce((a, b) => a + b, 0));
    let discount = 0;
    if (discountType === "PERCENT") discount = r2((subtotal * (Number(discountValue) || 0)) / 100);
    else if (discountType === "FIXED") discount = r2(Number(discountValue) || 0);
    discount = Math.min(discount, subtotal);
    const taxBase = r2(subtotal - discount);
    const factor = subtotal === 0 ? 0 : taxBase / subtotal;
    let vat = 0;
    if (standard) {
      items.forEach((it, i) => {
        const base = r2((lineNets[i] ?? 0) * factor);
        vat += r2((base * (Number(it.vatRate) || 0)) / 100);
      });
      vat = r2(vat);
    }
    return { subtotal, discount, taxBase, vat, grand: r2(taxBase + vat) };
  }, [items, taxMode, discountType, discountValue]);

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function applySuggestion(key: string, s: Suggestion) {
    updateItem(key, {
      description: s.name,
      unit: s.defaultUnit,
      unitPrice: s.lastUsedPrice ?? s.defaultPrice ?? "0",
      vatRate: s.vatRate ?? String(defaultVatRate),
      catalogItemId: s.catalogItemId,
    });
  }

  async function submit(finalizeAfter: boolean) {
    if (!customerId) return toast("Vyberte zákazníka.", "error");
    setSaving(true);
    const payload = {
      customerId,
      serviceAddressId: serviceAddressId || null,
      issueDate,
      validUntil,
      taxMode,
      noVatNote,
      documentDiscountType: discountType,
      documentDiscountValue: Number(discountValue) || 0,
      internalNote,
      customerNote,
      items: items.map((it) => ({
        description: it.description,
        detail: it.detail,
        quantity: Number(it.quantity) || 0,
        unit: it.unit,
        unitPrice: Number(it.unitPrice) || 0,
        discountPct: Number(it.discountPct) || 0,
        vatRate: Number(it.vatRate) || 0,
        catalogItemId: it.catalogItemId,
      })),
    };
    const res = await saveQuotation(payload, initial?.id);
    setSaving(false);
    if (res.ok) {
      toast("Cenová ponuka uložená.", "success");
      router.push(`/cenove-ponuky/${res.data.id}`);
      router.refresh();
    } else {
      toast(res.error, "error");
    }
  }

  const standard = taxMode === "STANDARD";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Základné údaje
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <label className="label">Zákazník *</label>
            <select className="input" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setServiceAddressId(""); }}>
              <option value="">— vyberte —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Servisná adresa</label>
            <select
              className="input"
              value={serviceAddressId}
              onChange={(e) => setServiceAddressId(e.target.value)}
              disabled={!selectedCustomer?.addresses.length}
            >
              <option value="">— žiadna —</option>
              {selectedCustomer?.addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Režim DPH</label>
            <select className="input" value={taxMode} onChange={(e) => setTaxMode(e.target.value)}>
              {Object.entries(TAX_MODE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Dátum vystavenia</label>
            <input type="date" className="input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Platnosť do</label>
            <input type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>
        {taxMode === "NO_VAT" && (
          <div className="mt-4">
            <label className="label">Poznámka k oslobodeniu od DPH</label>
            <input className="input" value={noVatNote} onChange={(e) => setNoVatNote(e.target.value)} />
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Položky</h2>
          <button type="button" className="btn-secondary py-1 text-xs" onClick={() => setCatalogModal(true)}>
            + Nová položka katalógu
          </button>
        </div>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.key} className="rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <label className="label text-xs">Popis položky #{idx + 1}</label>
                  <ItemAutocomplete
                    value={it.description}
                    onChange={(v) => updateItem(it.key, { description: v, catalogItemId: undefined })}
                    onSelect={(s) => applySuggestion(it.key, s)}
                    placeholder="Začnite písať…"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="label text-xs">Množstvo</label>
                  <input type="number" step="0.001" className="input" value={it.quantity} onChange={(e) => updateItem(it.key, { quantity: e.target.value })} />
                </div>
                <div className="lg:col-span-2">
                  <label className="label text-xs">MJ</label>
                  <input className="input" list="units-q" value={it.unit} onChange={(e) => updateItem(it.key, { unit: e.target.value })} />
                </div>
                <div className="lg:col-span-3">
                  <label className="label text-xs">Cena/MJ bez DPH</label>
                  <input type="number" step="0.01" className="input" value={it.unitPrice} onChange={(e) => updateItem(it.key, { unitPrice: e.target.value })} />
                </div>
                <div className="lg:col-span-5">
                  <label className="label text-xs">Detailný popis (voliteľné)</label>
                  <input className="input" value={it.detail} onChange={(e) => updateItem(it.key, { detail: e.target.value })} />
                </div>
                <div className="lg:col-span-2">
                  <label className="label text-xs">Zľava %</label>
                  <input type="number" step="0.001" className="input" value={it.discountPct} onChange={(e) => updateItem(it.key, { discountPct: e.target.value })} />
                </div>
                <div className="lg:col-span-2">
                  <label className="label text-xs">DPH %</label>
                  <select className="input" value={it.vatRate} disabled={!standard} onChange={(e) => updateItem(it.key, { vatRate: e.target.value })}>
                    {VAT_RATES.map((v) => (
                      <option key={v} value={v}>
                        {v} %
                      </option>
                    ))}
                    {!VAT_RATES.map(String).includes(it.vatRate) && <option value={it.vatRate}>{it.vatRate} %</option>}
                  </select>
                </div>
                <div className="flex items-end lg:col-span-3">
                  <div className="flex-1 text-right">
                    <div className="text-xs text-slate-400">Spolu bez DPH</div>
                    <div className="font-semibold text-brand-navy">
                      {formatCurrency(r2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) * (1 - (Number(it.discountPct) || 0) / 100)))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-2 rounded-md p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                    onClick={() => setItems((p) => p.filter((x) => x.key !== it.key))}
                    disabled={items.length === 1}
                    aria-label="Odstrániť"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <datalist id="units-q">
          {DEFAULT_UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <button type="button" className="btn-secondary mt-3" onClick={() => setItems((p) => [...p, newLine(defaultVatRate)])}>
          + Pridať položku
        </button>
      </div>

      {/* Discount + notes + totals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-4 p-6 lg:col-span-2">
          <div>
            <label className="label">Zľava na dokument</label>
            <div className="flex gap-2">
              <select className="input max-w-[160px]" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="NONE">Žiadna</option>
                <option value="PERCENT">Percentuálna %</option>
                <option value="FIXED">Pevná suma €</option>
              </select>
              <input type="number" step="0.01" className="input" value={discountValue} disabled={discountType === "NONE"} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Poznámka pre zákazníka (zobrazí sa v PDF)</label>
            <textarea className="input" rows={3} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />
          </div>
          <div>
            <label className="label">Interná poznámka (nezobrazí sa v PDF)</label>
            <textarea className="input" rows={2} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
          </div>
        </div>

        <div className="card h-fit p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Súhrn</h3>
          <SummaryRow label="Medzisúčet" value={formatCurrency(totals.subtotal)} />
          {totals.discount > 0 && <SummaryRow label="Zľava" value={`−${formatCurrency(totals.discount)}`} />}
          <SummaryRow label="Základ dane" value={formatCurrency(totals.taxBase)} />
          {standard && <SummaryRow label="DPH" value={formatCurrency(totals.vat)} />}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-dark px-3 py-2.5">
            <span className="font-semibold text-white">Celkom {standard ? "s DPH" : ""}</span>
            <span className="text-lg font-bold text-white">{formatCurrency(totals.grand)}</span>
          </div>
          {taxMode === "REVERSE_CHARGE" && (
            <p className="mt-2 text-xs font-semibold text-brand-dark">Prenesenie daňovej povinnosti.</p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-slate-50/80 py-3 backdrop-blur">
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={saving}>
          Zrušiť
        </button>
        <button type="button" className="btn-primary" onClick={() => submit(false)} disabled={saving}>
          {saving ? "Ukladám…" : initial ? "Uložiť zmeny" : "Uložiť ponuku"}
        </button>
      </div>

      {catalogModal && <QuickCatalogModal onClose={() => setCatalogModal(false)} />}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function QuickCatalogModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "SERVICE", defaultUnit: "ks", defaultPrice: "0", defaultVatRate: "23", description: "" });

  async function save() {
    setSaving(true);
    const res = await createCatalogItem(form);
    setSaving(false);
    if (res.ok) {
      toast("Položka pridaná do katalógu. Nájdete ju cez našepkávač.", "success");
      onClose();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nová položka katalógu"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.name}>
            {saving ? "Ukladám…" : "Uložiť"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <input className="input" placeholder="Názov" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(CATALOG_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input className="input" placeholder="MJ" value={form.defaultUnit} onChange={(e) => setForm({ ...form, defaultUnit: e.target.value })} />
          <input type="number" step="0.01" className="input" placeholder="Cena" value={form.defaultPrice} onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })} />
          <input type="number" step="0.001" className="input" placeholder="DPH %" value={form.defaultVatRate} onChange={(e) => setForm({ ...form, defaultVatRate: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
