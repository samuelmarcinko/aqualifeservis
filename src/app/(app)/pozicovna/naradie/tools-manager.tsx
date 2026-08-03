"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import {
  saveCategory,
  deleteCategory,
  uploadCategoryImage,
  saveTool,
  deleteTool,
  uploadToolImage,
} from "../actions";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  accessories: string | null;
  dailyPriceExVat: string;
  vatRate: string;
  quantity: number;
  position: number;
  active: boolean;
  imageUrl: string | null;
}
interface Category {
  id: string;
  name: string;
  description: string | null;
  position: number;
  active: boolean;
  imageUrl: string | null;
  tools: Tool[];
}

export function ToolsManager({ categories }: { categories: Category[] }) {
  const [catModal, setCatModal] = useState<Category | "new" | null>(null);
  const [toolModal, setToolModal] = useState<{ tool: Tool | null; categoryId: string } | null>(null);
  const [del, setDel] = useState<{ kind: "cat" | "tool"; id: string; name: string } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function doDelete() {
    if (!del) return;
    const res = del.kind === "cat" ? await deleteCategory(del.id) : await deleteTool(del.id);
    if (res.ok) {
      toast("Odstránené.", "success");
      router.refresh();
    } else toast(res.error, "error");
    setDel(null);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setCatModal("new")}>
          Nová kategória
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">
          Zatiaľ žiadne kategórie. Vytvorte prvú kategóriu a pridajte do nej náradie.
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-brand-navy">{c.name}</h3>
                  {!c.active && <span className="badge bg-slate-200 text-slate-600">Neaktívna</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary py-1 text-xs" onClick={() => setToolModal({ tool: null, categoryId: c.id })}>
                    + Náradie
                  </button>
                  <button className="btn-ghost py-1 text-xs" onClick={() => setCatModal(c)}>
                    Upraviť
                  </button>
                  <button className="btn-ghost py-1 text-xs text-red-600" onClick={() => setDel({ kind: "cat", id: c.id, name: c.name })}>
                    Zmazať
                  </button>
                </div>
              </div>

              {c.tools.length === 0 ? (
                <p className="text-sm text-slate-400">Žiadne náradie v tejto kategórii.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {c.tools.map((t) => (
                    <div key={t.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded bg-slate-50">
                        {t.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-300">Bez fotky</span>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-slate-800">{t.name}</div>
                        {!t.active && <span className="badge bg-slate-200 text-slate-600">Neakt.</span>}
                      </div>
                      <div className="text-sm text-brand-dark">{formatCurrency(t.dailyPriceExVat)} / deň bez DPH</div>
                      <div className="text-xs text-slate-400">Počet ks: {t.quantity}</div>
                      <div className="mt-2 flex gap-2">
                        <button className="btn-secondary py-1 text-xs" onClick={() => setToolModal({ tool: t, categoryId: c.id })}>
                          Upraviť
                        </button>
                        <button className="btn-ghost py-1 text-xs text-red-600" onClick={() => setDel({ kind: "tool", id: t.id, name: t.name })}>
                          Zmazať
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {catModal && (
        <CategoryModal category={catModal === "new" ? null : catModal} onClose={() => setCatModal(null)} />
      )}
      {toolModal && (
        <ToolModal
          tool={toolModal.tool}
          categoryId={toolModal.categoryId}
          categories={categories}
          onClose={() => setToolModal(null)}
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

function CategoryModal({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: category?.name ?? "",
    description: category?.description ?? "",
    position: category?.position ?? 0,
    active: category?.active ?? true,
  });

  async function save() {
    setSaving(true);
    const res = await saveCategory(form, category?.id);
    setSaving(false);
    if (res.ok) {
      toast("Uložené.", "success");
      onClose();
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? "Upraviť kategóriu" : "Nová kategória"}
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
        <div>
          <label className="label">Názov</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Popis</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="label">Poradie</label>
            <input type="number" className="input w-24" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm text-slate-600">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktívna
          </label>
        </div>
        {category && (
          <ImageUpload
            imageUrl={category.imageUrl}
            onUpload={(fd) => uploadCategoryImage(category.id, fd)}
          />
        )}
      </div>
    </Modal>
  );
}

function ToolModal({
  tool,
  categoryId,
  categories,
  onClose,
}: {
  tool: Tool | null;
  categoryId: string;
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoryId,
    name: tool?.name ?? "",
    description: tool?.description ?? "",
    accessories: tool?.accessories ?? "",
    dailyPriceExVat: tool?.dailyPriceExVat ?? "0",
    vatRate: tool?.vatRate ?? "23",
    quantity: tool?.quantity ?? 1,
    position: tool?.position ?? 0,
    active: tool?.active ?? true,
  });

  async function save() {
    setSaving(true);
    const res = await saveTool(form, tool?.id);
    setSaving(false);
    if (res.ok) {
      toast("Uložené.", "success");
      onClose();
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={tool ? "Upraviť náradie" : "Nové náradie"}
      size="lg"
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Názov</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Kategória</label>
          <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Počet kusov</label>
          <input type="number" min={1} className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Cena / deň bez DPH (€)</label>
          <input type="number" step="0.01" className="input" value={form.dailyPriceExVat} onChange={(e) => setForm({ ...form, dailyPriceExVat: e.target.value })} />
        </div>
        <div>
          <label className="label">Sadzba DPH (%)</label>
          <input type="number" step="0.001" className="input" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Popis</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Príslušenstvo (každé na nový riadok)</label>
          <textarea className="input" rows={3} value={form.accessories} onChange={(e) => setForm({ ...form, accessories: e.target.value })} placeholder="40-metrová hadica&#10;3 hydrantové hadice&#10;potrebné napojenia" />
        </div>
        <div>
          <label className="label">Poradie</label>
          <input type="number" className="input w-24" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
        </div>
        <label className="flex items-center gap-2 pt-6 text-sm text-slate-600">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktívne (viditeľné na webe)
        </label>
        {tool && (
          <div className="sm:col-span-2">
            <ImageUpload imageUrl={tool.imageUrl} onUpload={(fd) => uploadToolImage(tool.id, fd)} />
          </div>
        )}
      </div>
    </Modal>
  );
}

function ImageUpload({
  imageUrl,
  onUpload,
}: {
  imageUrl: string | null;
  onUpload: (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await onUpload(fd);
    setUploading(false);
    if (res.ok) {
      toast("Obrázok nahraný.", "success");
      router.refresh();
    } else toast(res.error ?? "Chyba", "error");
  }

  return (
    <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
      <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-slate-300">Bez fotky</span>
        )}
      </div>
      <label className="btn-secondary cursor-pointer text-xs">
        {uploading ? "Nahrávam…" : "Nahrať fotku"}
        <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
    </div>
  );
}
