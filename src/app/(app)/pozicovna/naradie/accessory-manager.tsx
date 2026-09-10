"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import {
  saveAccessoryGroup,
  deleteAccessoryGroup,
  saveAccessoryOption,
  deleteAccessoryOption,
  uploadAccessoryOptionImage,
} from "../actions";

export interface AccessoryOption {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dailyPriceExVat: string;
  position: number;
  active: boolean;
}
export interface AccessoryGroup {
  id: string;
  name: string;
  required: boolean;
  position: number;
  active: boolean;
  options: AccessoryOption[];
}

export function AccessoryManager({ toolId, groups: initial }: { toolId: string; groups: AccessoryGroup[] }) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<AccessoryGroup[]>(initial);
  const [groupModal, setGroupModal] = useState<AccessoryGroup | "new" | null>(null);
  const [optionModal, setOptionModal] = useState<{ groupId: string; option: AccessoryOption | null } | null>(null);
  const [del, setDel] = useState<{ kind: "group" | "option"; id: string; name: string } | null>(null);

  async function doDelete() {
    if (!del) return;
    const res = del.kind === "group" ? await deleteAccessoryGroup(del.id) : await deleteAccessoryOption(del.id);
    if (res.ok) {
      if (del.kind === "group") setGroups((gs) => gs.filter((g) => g.id !== del.id));
      else setGroups((gs) => gs.map((g) => ({ ...g, options: g.options.filter((o) => o.id !== del.id) })));
      toast("Odstránené.", "success");
    } else toast(res.error, "error");
    setDel(null);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-slate-500">Príslušenstvo</div>
        <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => setGroupModal("new")}>
          + Skupina
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
          Zatiaľ žiadne príslušenstvo. Pridajte skupinu (napr. „Sonda“) a do nej možnosti (malá / veľká sonda).
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="rounded-lg border border-slate-200 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{g.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      g.required ? "bg-brand/10 text-brand-dark" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {g.required ? "Povinné" : "Voliteľné"}
                  </span>
                  {!g.active && <span className="badge bg-slate-200 text-slate-600">Neakt.</span>}
                </div>
                <div className="flex gap-1">
                  <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setGroupModal(g)}>
                    Upraviť
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1 text-xs text-red-600"
                    onClick={() => setDel({ kind: "group", id: g.id, name: g.name })}
                  >
                    Zmazať
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {g.options.map((o) => (
                  <div key={o.id} className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5">
                    <div className="product-frame flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded">
                      {o.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.imageUrl} alt={o.name} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[8px] text-slate-300">bez fotky</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm text-slate-800">{o.name}</span>
                        {!o.active && <span className="text-[10px] text-slate-400">(neakt.)</span>}
                      </div>
                      <div className="text-xs text-brand-dark">{formatCurrency(o.dailyPriceExVat)} / deň</div>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={() => setOptionModal({ groupId: g.id, option: o })}
                    >
                      Upraviť
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-xs text-red-600"
                      onClick={() => setDel({ kind: "option", id: o.id, name: o.name })}
                    >
                      Zmazať
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs text-brand-dark"
                  onClick={() => setOptionModal({ groupId: g.id, option: null })}
                >
                  + Možnosť
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {groupModal && (
        <GroupModal
          toolId={toolId}
          group={groupModal === "new" ? null : groupModal}
          onClose={() => setGroupModal(null)}
          onSaved={(g) =>
            setGroups((gs) => (gs.some((x) => x.id === g.id) ? gs.map((x) => (x.id === g.id ? { ...x, ...g } : x)) : [...gs, g]))
          }
        />
      )}
      {optionModal && (
        <OptionModal
          groupId={optionModal.groupId}
          option={optionModal.option}
          onClose={() => setOptionModal(null)}
          onSaved={(groupId, o) =>
            setGroups((gs) =>
              gs.map((g) =>
                g.id !== groupId
                  ? g
                  : {
                      ...g,
                      options: g.options.some((x) => x.id === o.id)
                        ? g.options.map((x) => (x.id === o.id ? o : x))
                        : [...g.options, o],
                    },
              ),
            )
          }
        />
      )}
      <ConfirmDialog
        open={!!del}
        title="Odstrániť?"
        message={`Naozaj odstrániť „${del?.name}"?`}
        danger
        confirmLabel="Zmazať"
        onConfirm={doDelete}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}

function GroupModal({
  toolId,
  group,
  onClose,
  onSaved,
}: {
  toolId: string;
  group: AccessoryGroup | null;
  onClose: () => void;
  onSaved: (g: AccessoryGroup) => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    name: group?.name ?? "",
    required: group?.required ?? false,
    position: group?.position ?? 0,
    active: group?.active ?? true,
  });

  async function save() {
    setSaving(true);
    const res = await saveAccessoryGroup(toolId, f, group?.id);
    setSaving(false);
    if (res.ok) {
      onSaved({ id: res.data.id, ...f, options: group?.options ?? [] });
      toast("Uložené.", "success");
      onClose();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={group ? "Upraviť skupinu príslušenstva" : "Nová skupina príslušenstva"}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !f.name.trim()}>
            {saving ? "Ukladám…" : "Uložiť"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Názov skupiny</label>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="napr. Sonda" />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={f.required} onChange={(e) => setF({ ...f, required: e.target.checked })} />
          <span>
            Povinné – zákazník musí vybrať jednu možnosť.
            <span className="block text-xs text-slate-400">Ak nie je zaškrtnuté, výber je dobrovoľný (zákazník môže vybrať aj viac).</span>
          </span>
        </label>
        <div className="flex items-center gap-4">
          <div>
            <label className="label">Poradie</label>
            <input type="number" className="input w-24" value={f.position} onChange={(e) => setF({ ...f, position: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm text-slate-600">
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Aktívne
          </label>
        </div>
      </div>
    </Modal>
  );
}

function OptionModal({
  groupId,
  option,
  onClose,
  onSaved,
}: {
  groupId: string;
  option: AccessoryOption | null;
  onClose: () => void;
  onSaved: (groupId: string, o: AccessoryOption) => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [img, setImg] = useState<string | null>(option?.imageUrl ?? null);
  const [f, setF] = useState({
    name: option?.name ?? "",
    description: option?.description ?? "",
    dailyPriceExVat: option?.dailyPriceExVat ?? "0",
    position: option?.position ?? 0,
    active: option?.active ?? true,
  });

  async function save() {
    setSaving(true);
    const res = await saveAccessoryOption(groupId, f, option?.id);
    setSaving(false);
    if (res.ok) {
      onSaved(groupId, {
        id: res.data.id,
        name: f.name,
        description: f.description || null,
        imageUrl: img,
        dailyPriceExVat: f.dailyPriceExVat,
        position: f.position,
        active: f.active,
      });
      toast("Uložené.", "success");
      onClose();
    } else toast(res.error, "error");
  }

  async function upload(file: File) {
    if (!option?.id) {
      toast("Najprv uložte možnosť, potom pridajte fotku.", "error");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await uploadAccessoryOptionImage(option.id, fd);
    setUploading(false);
    if (res.ok) {
      setImg(res.data.url);
      onSaved(groupId, {
        id: option.id,
        name: f.name,
        description: f.description || null,
        imageUrl: res.data.url,
        dailyPriceExVat: f.dailyPriceExVat,
        position: f.position,
        active: f.active,
      });
      toast("Fotka nahraná.", "success");
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={option ? "Upraviť možnosť" : "Nová možnosť príslušenstva"}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !f.name.trim()}>
            {saving ? "Ukladám…" : "Uložiť"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Názov možnosti</label>
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="napr. Malá sonda" />
          </div>
          <div>
            <label className="label">Cena / deň bez DPH (€)</label>
            <input type="number" step="0.01" className="input" value={f.dailyPriceExVat} onChange={(e) => setF({ ...f, dailyPriceExVat: e.target.value })} />
          </div>
          <div>
            <label className="label">Poradie</label>
            <input type="number" className="input" value={f.position} onChange={(e) => setF({ ...f, position: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label">Krátky popis</label>
          <textarea className="input" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="napr. priemer 12 mm, dosah do 8 m" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Aktívne (viditeľné na webe)
        </label>

        <div className="border-t border-slate-100 pt-3">
          <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Fotka</div>
          {option?.id ? (
            <div className="flex items-center gap-3">
              <div className="product-frame flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[9px] text-slate-300">bez fotky</span>
                )}
              </div>
              <label className="btn-secondary cursor-pointer text-xs">
                {uploading ? "Nahrávam…" : img ? "Zmeniť fotku" : "Nahrať fotku"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Fotku pridáte po uložení možnosti (znova ju otvorte).</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
