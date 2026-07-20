"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatPercent } from "@/lib/format";
import { CATALOG_TYPE_LABELS, DEFAULT_UNITS } from "@/lib/constants";
import { createCatalogItem, updateCatalogItem, archiveCatalogItem } from "./actions";

interface Item {
  id: string;
  name: string;
  type: string;
  description: string | null;
  defaultUnit: string;
  defaultPrice: string;
  defaultVatRate: string;
  usageCount: number;
  archived: boolean;
}

export function CatalogManager({ items, showArchived }: { items: Item[]; showArchived: boolean }) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggleArchive(item: Item) {
    const res = await archiveCatalogItem(item.id, !item.archived);
    if (res.ok) {
      toast(item.archived ? "Položka obnovená." : "Položka archivovaná.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 text-sm">
          <Link href="/katalog" className={!showArchived ? "font-semibold text-brand-dark" : "text-slate-500"}>
            Aktívne
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/katalog?archived=1"
            className={showArchived ? "font-semibold text-brand-dark" : "text-slate-500"}
          >
            Archivované
          </Link>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          Nová položka
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Žiadne položky.</div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Názov</th>
                <th>Typ</th>
                <th>MJ</th>
                <th className="text-right">Cena bez DPH</th>
                <th className="text-right">DPH</th>
                <th className="text-center">Použité</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="font-medium text-slate-800">{i.name}</div>
                    {i.description && <div className="text-xs text-slate-400">{i.description}</div>}
                  </td>
                  <td>
                    <span className="badge bg-slate-100 text-slate-600">
                      {CATALOG_TYPE_LABELS[i.type]}
                    </span>
                  </td>
                  <td>{i.defaultUnit}</td>
                  <td className="text-right">{formatCurrency(i.defaultPrice)}</td>
                  <td className="text-right">{formatPercent(i.defaultVatRate)}</td>
                  <td className="text-center">{i.usageCount}</td>
                  <td className="text-right">
                    <button className="btn-secondary py-1 text-xs" onClick={() => setEditing(i)}>
                      Upraviť
                    </button>
                    <button
                      className="btn-ghost py-1 text-xs"
                      onClick={() => toggleArchive(i)}
                    >
                      {i.archived ? "Obnoviť" : "Archivovať"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <CatalogModal
          item={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CatalogModal({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    type: item?.type ?? "SERVICE",
    description: item?.description ?? "",
    defaultUnit: item?.defaultUnit ?? "ks",
    defaultPrice: item?.defaultPrice ?? "0",
    defaultVatRate: item?.defaultVatRate ?? "23",
  });

  async function save() {
    setSaving(true);
    const res = item ? await updateCatalogItem(item.id, form) : await createCatalogItem(form);
    setSaving(false);
    if (res.ok) {
      toast("Položka uložená.", "success");
      onClose();
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Upraviť položku" : "Nová položka katalógu"}
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
      <div className="space-y-4">
        <div>
          <label className="label">Názov *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Typ</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(CATALOG_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Merná jednotka</label>
            <input
              className="input"
              list="units"
              value={form.defaultUnit}
              onChange={(e) => setForm({ ...form, defaultUnit: e.target.value })}
            />
            <datalist id="units">
              {DEFAULT_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Cena bez DPH (€)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.defaultPrice}
              onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Sadzba DPH (%)</label>
            <input
              type="number"
              step="0.001"
              className="input"
              value={form.defaultVatRate}
              onChange={(e) => setForm({ ...form, defaultVatRate: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Popis</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}
