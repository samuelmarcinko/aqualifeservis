"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ItemAutocomplete } from "@/components/editor/item-autocomplete";
import { DEFAULT_UNITS } from "@/lib/constants";
import { saveProtocol } from "./actions";
import { ProtocolAiAssistant } from "./protocol-ai-assistant";
import type { AiProtocolDraft } from "@/lib/services/ai";

interface CustomerAddress {
  id: string;
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  objectType: string | null;
  apartment: string | null;
}
interface CustomerOption {
  id: string;
  name: string;
  addresses: CustomerAddress[];
}

interface WorkItem {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  internalNote: string;
  catalogItemId?: string;
}

export interface ProtocolEditorInitial {
  id: string;
  customerId: string;
  serviceAddressId: string | null;
  insuranceEventNumber: string | null;
  documentDate: string;
  faultDate: string | null;
  repairDate: string | null;
  objectStreet: string | null;
  objectCity: string | null;
  objectPostalCode: string | null;
  objectType: string | null;
  objectApartment: string | null;
  insuranceContractNumber: string | null;
  insurer: string | null;
  objectNote: string | null;
  faultType: string | null;
  faultCause: string | null;
  faultDescription: string | null;
  damageExtent: string | null;
  technicianStatement: string | null;
  notes: string | null;
  recommendations: string | null;
  workItems: { description: string; quantity: string | null; unit: string | null; internalNote: string | null; catalogItemId: string | null }[];
}

const nk = () => Math.random().toString(36).slice(2);

export function ProtocolEditor({
  customers,
  preselectCustomerId,
  initial,
  aiEnabled,
}: {
  customers: CustomerOption[];
  preselectCustomerId?: string;
  initial?: ProtocolEditorInitial;
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [f, setF] = useState({
    customerId: initial?.customerId ?? preselectCustomerId ?? "",
    serviceAddressId: initial?.serviceAddressId ?? "",
    insuranceEventNumber: initial?.insuranceEventNumber ?? "",
    documentDate: initial?.documentDate?.slice(0, 10) ?? today,
    faultDate: initial?.faultDate?.slice(0, 10) ?? "",
    repairDate: initial?.repairDate?.slice(0, 10) ?? "",
    objectStreet: initial?.objectStreet ?? "",
    objectCity: initial?.objectCity ?? "",
    objectPostalCode: initial?.objectPostalCode ?? "",
    objectType: initial?.objectType ?? "",
    objectApartment: initial?.objectApartment ?? "",
    insuranceContractNumber: initial?.insuranceContractNumber ?? "",
    insurer: initial?.insurer ?? "",
    objectNote: initial?.objectNote ?? "",
    faultType: initial?.faultType ?? "",
    faultCause: initial?.faultCause ?? "",
    faultDescription: initial?.faultDescription ?? "",
    damageExtent: initial?.damageExtent ?? "",
    technicianStatement: initial?.technicianStatement ?? "",
    notes: initial?.notes ?? "",
    recommendations: initial?.recommendations ?? "",
  });
  const [workItems, setWorkItems] = useState<WorkItem[]>(
    initial?.workItems.map((w) => ({
      key: nk(),
      description: w.description,
      quantity: w.quantity ?? "",
      unit: w.unit ?? "",
      internalNote: w.internalNote ?? "",
      catalogItemId: w.catalogItemId ?? undefined,
    })) ?? [],
  );

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const selectedCustomer = customers.find((c) => c.id === f.customerId);

  // Selecting a service address prefills the object fields from that address.
  function onSelectAddress(id: string) {
    const addr = selectedCustomer?.addresses.find((a) => a.id === id);
    setF((prev) => ({
      ...prev,
      serviceAddressId: id,
      ...(addr
        ? {
            objectStreet: addr.street ?? "",
            objectCity: addr.city ?? "",
            objectPostalCode: addr.postalCode ?? "",
            objectType: addr.objectType ?? "",
            objectApartment: addr.apartment ?? "",
          }
        : {}),
    }));
  }

  function updateWork(key: string, patch: Partial<WorkItem>) {
    setWorkItems((p) => p.map((w) => (w.key === key ? { ...w, ...patch } : w)));
  }

  // Merge an AI-generated draft into the form (only fills where AI provided a
  // value; never wipes existing input). Work items are appended.
  function applyAiDraft(d: AiProtocolDraft) {
    const isIso = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const pick = (v: string | undefined, prev: string) => (v && v.trim() ? v.trim() : prev);

    // Try to match a mentioned customer name to the customer list.
    let matchedCustomerId: string | null = null;
    if (d.customerName?.trim()) {
      const norm = (s: string) =>
        s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
      const target = norm(d.customerName);
      const matches = customers.filter((c) => {
        const n = norm(c.name);
        if (!n || !target) return false;
        if (n === target) return true;
        const shorter = Math.min(n.length, target.length);
        return shorter >= 4 && (n.includes(target) || target.includes(n));
      });
      if (matches.length === 1) matchedCustomerId = matches[0]!.id;
      else if (matches.length === 0)
        toast(`Zákazník „${d.customerName}“ sa nenašiel v zozname – vyberte ho ručne.`, "info");
      else toast(`Pre „${d.customerName}“ je viac zhôd – vyberte zákazníka ručne.`, "info");
    }

    setF((prev) => ({
      ...prev,
      ...(matchedCustomerId ? { customerId: matchedCustomerId, serviceAddressId: "" } : {}),
      faultType: pick(d.faultType, prev.faultType),
      faultCause: pick(d.faultCause, prev.faultCause),
      faultDescription: pick(d.faultDescription, prev.faultDescription),
      damageExtent: pick(d.damageExtent, prev.damageExtent),
      objectNote: pick(d.objectNote, prev.objectNote),
      insurer: pick(d.insurer, prev.insurer),
      insuranceContractNumber: pick(d.insuranceContractNumber, prev.insuranceContractNumber),
      insuranceEventNumber: pick(d.insuranceEventNumber, prev.insuranceEventNumber),
      faultDate: isIso(d.faultDate) ? d.faultDate! : prev.faultDate,
      repairDate: isIso(d.repairDate) ? d.repairDate! : prev.repairDate,
      technicianStatement: pick(d.technicianStatement, prev.technicianStatement),
      notes: pick(d.notes, prev.notes),
      recommendations: pick(d.recommendations, prev.recommendations),
    }));
    if (d.workItems?.length) {
      setWorkItems((prev) => [
        ...prev.filter((w) => w.description.trim()),
        ...d.workItems!
          .filter((w) => w.description?.trim())
          .map((w) => ({
            key: nk(),
            description: w.description.trim(),
            quantity: w.quantity != null ? String(w.quantity) : "",
            unit: w.unit ?? "",
            internalNote: "",
          })),
      ]);
    }
  }

  async function submit() {
    setFormError(null);
    if (!f.customerId) {
      setFormError("Vyberte zákazníka.");
      return toast("Vyberte zákazníka.", "error");
    }
    setSaving(true);
    const payload = {
      ...f,
      serviceAddressId: f.serviceAddressId || null,
      faultDate: f.faultDate || null,
      repairDate: f.repairDate || null,
      workItems: workItems
        .filter((w) => w.description.trim())
        .map((w) => ({
          description: w.description,
          quantity: w.quantity ? Number(w.quantity) : null,
          unit: w.unit || null,
          internalNote: w.internalNote || null,
          catalogItemId: w.catalogItemId,
        })),
    };
    const res = await saveProtocol(payload, initial?.id);
    setSaving(false);
    if (res.ok) {
      toast("Protokol uložený.", "success");
      router.push(`/protokoly/${res.data.id}`);
      router.refresh();
    } else {
      setFormError(res.error);
      toast(res.error, "error");
    }
  }

  return (
    <div className="space-y-6">
      {aiEnabled && <ProtocolAiAssistant onApply={applyAiDraft} />}

      <Section title="1. Identifikácia protokolu">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Číslo poistnej udalosti">
            <input className="input" value={f.insuranceEventNumber} onChange={set("insuranceEventNumber")} />
          </Field>
          <Field label="Dátum vyhotovenia">
            <input type="date" className="input" value={f.documentDate} onChange={set("documentDate")} />
          </Field>
          <Field label="Dátum vzniku poruchy">
            <input type="date" className="input" value={f.faultDate} onChange={set("faultDate")} />
          </Field>
          <Field label="Dátum vykonania opravy">
            <input type="date" className="input" value={f.repairDate} onChange={set("repairDate")} />
          </Field>
        </div>
      </Section>

      <Section title="2. Údaje o klientovi">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Zákazník *">
            <select className="input" value={f.customerId} onChange={(e) => setF({ ...f, customerId: e.target.value, serviceAddressId: "" })}>
              <option value="">— vyberte —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="3. Miesto a objekt opravy">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Servisná adresa">
            <select
              className="input"
              value={f.serviceAddressId}
              onChange={(e) => onSelectAddress(e.target.value)}
              disabled={!selectedCustomer?.addresses.length}
            >
              <option value="">— vlastná adresa (vyplňte nižšie) —</option>
              {selectedCustomer?.addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            {f.serviceAddressId && (
              <p className="mt-1 text-xs text-slate-400">Polia objektu sú predvyplnené z adresy, môžete ich upraviť.</p>
            )}
          </Field>
          <Field label="Ulica a číslo objektu">
            <input className="input" value={f.objectStreet} onChange={set("objectStreet")} />
          </Field>
          <Field label="Mesto">
            <input className="input" value={f.objectCity} onChange={set("objectCity")} />
          </Field>
          <Field label="PSČ">
            <input className="input" value={f.objectPostalCode} onChange={set("objectPostalCode")} />
          </Field>
          <Field label="Typ objektu">
            <input className="input" value={f.objectType} onChange={set("objectType")} />
          </Field>
          <Field label="Číslo bytu / poschodie">
            <input className="input" value={f.objectApartment} onChange={set("objectApartment")} />
          </Field>
          <Field label="Číslo poistnej zmluvy">
            <input className="input" value={f.insuranceContractNumber} onChange={set("insuranceContractNumber")} />
          </Field>
          <Field label="Poisťovňa">
            <input className="input" value={f.insurer} onChange={set("insurer")} />
          </Field>
          <Field label="Poznámka k objektu" full>
            <textarea className="input" rows={2} value={f.objectNote} onChange={set("objectNote")} />
          </Field>
        </div>
      </Section>

      <Section title="4. Diagnostika poruchy">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Typ poruchy">
            <input className="input" value={f.faultType} onChange={set("faultType")} />
          </Field>
          <Field label="Príčina poruchy">
            <textarea className="input" rows={2} value={f.faultCause} onChange={set("faultCause")} />
          </Field>
          <Field label="Podrobný popis poruchy">
            <textarea className="input" rows={4} value={f.faultDescription} onChange={set("faultDescription")} />
          </Field>
          <Field label="Rozsah poškodenia">
            <textarea className="input" rows={3} value={f.damageExtent} onChange={set("damageExtent")} />
          </Field>
        </div>
      </Section>

      <Section title="5. Vykonané práce a použitý materiál">
        <div className="space-y-3">
          {workItems.map((w, idx) => (
            <div key={w.key} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <label className="label text-xs">Popis #{idx + 1}</label>
                <ItemAutocomplete
                  value={w.description}
                  onChange={(v) => updateWork(w.key, { description: v, catalogItemId: undefined })}
                  onSelect={(s) => updateWork(w.key, { description: s.name, unit: s.defaultUnit, catalogItemId: s.catalogItemId })}
                />
              </div>
              <div className="lg:col-span-2">
                <label className="label text-xs">Množstvo</label>
                <input type="number" step="0.001" className="input" value={w.quantity} onChange={(e) => updateWork(w.key, { quantity: e.target.value })} />
              </div>
              <div className="lg:col-span-2">
                <label className="label text-xs">MJ</label>
                <input className="input" list="units-p" value={w.unit} onChange={(e) => updateWork(w.key, { unit: e.target.value })} />
              </div>
              <div className="flex items-end lg:col-span-2">
                <button type="button" className="btn-ghost text-red-500" onClick={() => setWorkItems((p) => p.filter((x) => x.key !== w.key))}>
                  Odstrániť
                </button>
              </div>
            </div>
          ))}
          <datalist id="units-p">
            {DEFAULT_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <button type="button" className="btn-secondary" onClick={() => setWorkItems((p) => [...p, { key: nk(), description: "", quantity: "", unit: "", internalNote: "" }])}>
            + Pridať položku
          </button>
        </div>
      </Section>

      <Section title="6. Vyjadrenie technika / poznámky">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Vyjadrenie technika">
            <textarea className="input" rows={3} value={f.technicianStatement} onChange={set("technicianStatement")} />
          </Field>
          <Field label="Poznámky">
            <textarea className="input" rows={2} value={f.notes} onChange={set("notes")} />
          </Field>
          <Field label="Odporúčania">
            <textarea className="input" rows={2} value={f.recommendations} onChange={set("recommendations")} />
          </Field>
        </div>
      </Section>

      {!initial && (
        <p className="rounded-lg bg-brand/5 px-4 py-3 text-sm text-brand-dark">
          Fotodokumentáciu môžete pridať po uložení protokolu na jeho detailnej stránke.
        </p>
      )}

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-slate-50/80 py-3 backdrop-blur">
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={saving}>
          Zrušiť
        </button>
        <button type="button" className="btn-primary" onClick={submit} disabled={saving}>
          {saving ? "Ukladám…" : initial ? "Uložiť zmeny" : "Uložiť protokol"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-dark">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2 lg:col-span-3" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
