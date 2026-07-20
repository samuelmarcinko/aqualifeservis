"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { QuotationStatusBadge, ProtocolStatusBadge } from "@/components/ui/badges";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  saveServiceAddress,
  deleteServiceAddress,
  addCustomerNote,
} from "../actions";

interface Address {
  id: string;
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  objectType: string | null;
  apartment: string | null;
  note: string | null;
  isDefault: boolean;
}

interface Props {
  customer: {
    id: string;
    type: string;
    firstName: string | null;
    lastName: string | null;
    businessName: string | null;
    contactPerson: string | null;
    ico: string | null;
    dic: string | null;
    icDph: string | null;
    vatPayer: boolean;
    email: string | null;
    phone: string | null;
    phoneSecondary: string | null;
    street: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
    internalNote: string | null;
    createdAt: string;
  };
  serviceAddresses: Address[];
  notes: { id: string; body: string; createdAt: string }[];
  quotations: {
    id: string;
    number: string;
    revision: number;
    status: string;
    grandTotal: string;
    issueDate: string;
  }[];
  protocols: { id: string; number: string; revision: number; status: string; documentDate: string }[];
  activities: { id: string; type: string; description: string; actor: string; createdAt: string }[];
}

const TABS = [
  { key: "zakladne", label: "Základné údaje" },
  { key: "adresy", label: "Servisné adresy" },
  { key: "ponuky", label: "Cenové ponuky" },
  { key: "protokoly", label: "Protokoly" },
  { key: "historia", label: "História" },
  { key: "poznamky", label: "Poznámky" },
];

export function CustomerDetail(props: Props) {
  const [tab, setTab] = useState("zakladne");
  const { customer } = props;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-brand-dark text-brand-dark"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "zakladne" && <BasicInfo customer={customer} />}
      {tab === "adresy" && (
        <ServiceAddresses customerId={customer.id} addresses={props.serviceAddresses} />
      )}
      {tab === "ponuky" && <QuotationsList quotations={props.quotations} customerId={customer.id} />}
      {tab === "protokoly" && <ProtocolsList protocols={props.protocols} customerId={customer.id} />}
      {tab === "historia" && <History activities={props.activities} />}
      {tab === "poznamky" && <Notes customerId={customer.id} notes={props.notes} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value || "—"}</span>
    </div>
  );
}

function BasicInfo({ customer }: { customer: Props["customer"] }) {
  const isBusiness = customer.type !== "PERSON";
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="card p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {isBusiness ? "Firemné údaje" : "Osobné údaje"}
        </h3>
        {isBusiness ? (
          <>
            <Row label="Obchodný názov" value={customer.businessName} />
            <Row label="Kontaktná osoba" value={customer.contactPerson} />
            <Row label="IČO" value={customer.ico} />
            <Row label="DIČ" value={customer.dic} />
            <Row label="IČ DPH" value={customer.icDph} />
            <Row label="Platca DPH" value={customer.vatPayer ? "Áno" : "Nie"} />
          </>
        ) : (
          <>
            <Row label="Meno" value={customer.firstName} />
            <Row label="Priezvisko" value={customer.lastName} />
          </>
        )}
      </div>
      <div className="card p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Kontakt a adresa
        </h3>
        <Row label="E-mail" value={customer.email} />
        <Row label="Telefón" value={customer.phone} />
        <Row label="Sekundárny telefón" value={customer.phoneSecondary} />
        <Row
          label="Adresa"
          value={[customer.street, `${customer.postalCode ?? ""} ${customer.city ?? ""}`.trim(), customer.country]
            .filter(Boolean)
            .join(", ")}
        />
        <Row label="Vytvorený" value={formatDate(customer.createdAt)} />
      </div>
      {customer.internalNote && (
        <div className="card p-6 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Interná poznámka
          </h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{customer.internalNote}</p>
        </div>
      )}
    </div>
  );
}

function ServiceAddresses({ customerId, addresses }: { customerId: string; addresses: Address[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    const res = await deleteServiceAddress(customerId, deleteId);
    if (res.ok) {
      toast("Adresa odstránená.", "success");
      router.refresh();
    } else toast(res.error, "error");
    setDeleteId(null);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setCreating(true)}>
          Pridať adresu
        </button>
      </div>
      {addresses.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">
          Zákazník zatiaľ nemá žiadne servisné adresy.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-semibold text-brand-navy">{a.label}</h4>
                {a.isDefault && (
                  <span className="badge bg-brand/10 text-brand-dark">Predvolená</span>
                )}
              </div>
              <p className="text-sm text-slate-600">
                {[a.street, `${a.postalCode ?? ""} ${a.city ?? ""}`.trim(), a.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {(a.objectType || a.apartment) && (
                <p className="mt-1 text-xs text-slate-400">
                  {[a.objectType, a.apartment].filter(Boolean).join(" · ")}
                </p>
              )}
              {a.note && <p className="mt-2 text-xs text-slate-500">{a.note}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary py-1 text-xs" onClick={() => setEditing(a)}>
                  Upraviť
                </button>
                <button className="btn-ghost py-1 text-xs text-red-600" onClick={() => setDeleteId(a.id)}>
                  Odstrániť
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <AddressModal
          customerId={customerId}
          address={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        title="Odstrániť adresu?"
        message="Túto akciu nie je možné vrátiť späť."
        danger
        confirmLabel="Odstrániť"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function AddressModal({
  customerId,
  address,
  onClose,
}: {
  customerId: string;
  address: Address | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: address?.label ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "Slovensko",
    objectType: address?.objectType ?? "",
    apartment: address?.apartment ?? "",
    note: address?.note ?? "",
    isDefault: address?.isDefault ?? false,
  });

  async function save() {
    setSaving(true);
    const res = await saveServiceAddress(customerId, form, address?.id);
    setSaving(false);
    if (res.ok) {
      toast("Adresa uložená.", "success");
      onClose();
      router.refresh();
    } else toast(res.error, "error");
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <Modal
      open
      onClose={onClose}
      title={address ? "Upraviť adresu" : "Nová servisná adresa"}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.label}>
            {saving ? "Ukladám…" : "Uložiť"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Označenie *</label>
          <input className="input" value={form.label} onChange={set("label")} placeholder="napr. Rodinný dom Kamenica" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Ulica a číslo</label>
          <input className="input" value={form.street} onChange={set("street")} />
        </div>
        <div>
          <label className="label">Mesto</label>
          <input className="input" value={form.city} onChange={set("city")} />
        </div>
        <div>
          <label className="label">PSČ</label>
          <input className="input" value={form.postalCode} onChange={set("postalCode")} />
        </div>
        <div>
          <label className="label">Typ objektu</label>
          <input className="input" value={form.objectType} onChange={set("objectType")} placeholder="Byt / Rodinný dom…" />
        </div>
        <div>
          <label className="label">Číslo bytu / poschodie</label>
          <input className="input" value={form.apartment} onChange={set("apartment")} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Poznámka</label>
          <textarea className="input" rows={2} value={form.note} onChange={set("note")} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} /> Predvolená
          servisná adresa
        </label>
      </div>
    </Modal>
  );
}

function QuotationsList({
  quotations,
  customerId,
}: {
  quotations: Props["quotations"];
  customerId: string;
}) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href={`/cenove-ponuky/nova?customerId=${customerId}`} className="btn-primary">
          Nová ponuka
        </Link>
      </div>
      {quotations.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Žiadne cenové ponuky.</div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Číslo</th>
                <th>Stav</th>
                <th>Dátum</th>
                <th className="text-right">Suma s DPH</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/cenove-ponuky/${q.id}`} className="font-semibold text-brand-dark hover:underline">
                      {q.number}
                      {q.revision > 1 && <span className="text-slate-400"> · rev. {q.revision}</span>}
                    </Link>
                  </td>
                  <td>
                    <QuotationStatusBadge status={q.status} />
                  </td>
                  <td>{formatDate(q.issueDate)}</td>
                  <td className="text-right font-medium">{formatCurrency(q.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProtocolsList({
  protocols,
  customerId,
}: {
  protocols: Props["protocols"];
  customerId: string;
}) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href={`/protokoly/novy?customerId=${customerId}`} className="btn-primary">
          Nový protokol
        </Link>
      </div>
      {protocols.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Žiadne protokoly.</div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Číslo</th>
                <th>Stav</th>
                <th>Dátum</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/protokoly/${p.id}`} className="font-semibold text-brand-dark hover:underline">
                      {p.number}
                      {p.revision > 1 && <span className="text-slate-400"> · rev. {p.revision}</span>}
                    </Link>
                  </td>
                  <td>
                    <ProtocolStatusBadge status={p.status} />
                  </td>
                  <td>{formatDate(p.documentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function History({ activities }: { activities: Props["activities"] }) {
  if (activities.length === 0)
    return <div className="card p-8 text-center text-sm text-slate-400">Žiadna história.</div>;
  return (
    <div className="card p-6">
      <ol className="relative border-l border-slate-200">
        {activities.map((a) => (
          <li key={a.id} className="mb-5 ml-4 last:mb-0">
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand" />
            <p className="text-sm font-medium text-slate-800">{a.description}</p>
            <p className="text-xs text-slate-400">
              {formatDateTime(a.createdAt)} · {a.actor}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Notes({ customerId, notes }: { customerId: string; notes: Props["notes"] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!body.trim()) return;
    setSaving(true);
    const res = await addCustomerNote(customerId, { body });
    setSaving(false);
    if (res.ok) {
      setBody("");
      toast("Poznámka pridaná.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <textarea
          className="input"
          rows={3}
          placeholder="Nová poznámka…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button className="btn-primary" onClick={add} disabled={saving || !body.trim()}>
            {saving ? "Pridávam…" : "Pridať poznámku"}
          </button>
        </div>
      </div>
      {notes.map((n) => (
        <div key={n.id} className="card p-5">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{n.body}</p>
          <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}
