"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import type { ActionResult } from "@/lib/action-result";
import {
  saveCategory,
  deleteCategory,
  uploadCategoryImage,
  saveTool,
  deleteTool,
  uploadToolImage,
  uploadToolGalleryPhoto,
  deleteToolGalleryPhoto,
  uploadToolManual,
  deleteToolManual,
  saveToolVideos,
} from "../actions";

interface Tool {
  id: string;
  name: string;
  model: string | null;
  description: string | null;
  accessories: string | null;
  dailyPriceExVat: string;
  vatRate: string;
  quantity: number;
  position: number;
  active: boolean;
  imageUrl: string | null;
  galleryPhotos: string[];
  manuals: { url: string; name: string }[];
  videos: string[];
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
        <div className="space-y-5">
          {categories.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-brand-navy">{c.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {c.tools.length}
                  </span>
                  {!c.active && <span className="badge bg-slate-200 text-slate-600">Neaktívna</span>}
                </div>
                <div className="flex gap-1">
                  <button className="btn-primary py-1 text-xs" onClick={() => setToolModal({ tool: null, categoryId: c.id })}>
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
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
                  Žiadne náradie v tejto kategórii.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                  {c.tools.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-2 transition hover:bg-slate-50">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50">
                        {t.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-slate-300">Bez fotky</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-800">{t.name}</span>
                          {!t.active && <span className="badge shrink-0 bg-slate-200 text-slate-600">Neakt.</span>}
                        </div>
                        {t.model && <div className="truncate text-xs text-slate-400">{t.model}</div>}
                      </div>

                      <div className="hidden shrink-0 text-right text-sm font-medium text-brand-dark sm:block">
                        {formatCurrency(t.dailyPriceExVat)}
                        <span className="block text-[11px] font-normal text-slate-400">/ deň bez DPH</span>
                      </div>

                      <div className="hidden w-14 shrink-0 text-right text-xs text-slate-500 md:block">
                        {t.quantity} ks
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button className="btn-secondary py-1 text-xs" onClick={() => setToolModal({ tool: t, categoryId: c.id })}>
                          Upraviť
                        </button>
                        <button
                          className="btn-ghost px-2 py-1 text-xs text-red-600"
                          title="Zmazať"
                          onClick={() => setDel({ kind: "tool", id: t.id, name: t.name })}
                        >
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
    model: tool?.model ?? "",
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
      size="2xl"
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
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
        {/* ── Ľavý stĺpec: údaje ───────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <label className="label">Základný názov</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="napr. Mechanická čistička potrubí a odtokov" />
          </div>
          <div>
            <label className="label">Model (druhý nadpis)</label>
            <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder={'napr. RIDGID FlexShaft K9-204+ 2"-4" (50-100 mm)'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div>
            <label className="label">Popis</label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm({ ...form, description: html })}
              placeholder="Popíšte náradie, jeho použitie a parametre…"
            />
          </div>
          <div>
            <label className="label">Príslušenstvo (každé na nový riadok)</label>
            <textarea className="input" rows={3} value={form.accessories} onChange={(e) => setForm({ ...form, accessories: e.target.value })} placeholder="40-metrová hadica&#10;3 hydrantové hadice&#10;potrebné napojenia" />
          </div>
          <div className="flex items-end gap-6">
            <div>
              <label className="label">Poradie</label>
              <input type="number" className="input w-24" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-600">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktívne (viditeľné na webe)
            </label>
          </div>
        </div>

        {/* ── Pravý stĺpec: médiá ──────────────────────────────── */}
        <div className="space-y-5 lg:border-l lg:border-slate-100 lg:pl-8">
          {tool ? (
            <>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Hlavná fotka</div>
                <ImageUpload imageUrl={tool.imageUrl} onUpload={(fd) => uploadToolImage(tool.id, fd)} />
              </div>
              <ToolGallery toolId={tool.id} photos={tool.galleryPhotos} />
              <ToolManuals toolId={tool.id} manuals={tool.manuals} />
              <ToolVideos toolId={tool.id} videos={tool.videos} />
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400">
              Fotky, galériu, manuály a videá pridáte po uložení náradia (znova ho otvorte na úpravu).
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ToolGallery({ toolId, photos }: { toolId: string; photos: string[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [list, setList] = useState(photos);

  async function upload(files: FileList) {
    setUploading(true);
    let failed = "";
    // Sequential: each upload reads-appends-writes the gallery array, so
    // parallel uploads would overwrite each other.
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await uploadToolGalleryPhoto(toolId, fd);
      if (res.ok) setList(res.data.photos);
      else {
        failed = res.error;
        break;
      }
    }
    setUploading(false);
    if (failed) toast(failed, "error");
    else toast("Fotky pridané do galérie.", "success");
    router.refresh();
  }
  async function remove(url: string) {
    const res = await deleteToolGalleryPhoto(toolId, url);
    if (res.ok) {
      setList(res.data.photos);
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Galéria (ďalšie fotky)</div>
      <div className="flex flex-wrap gap-2">
        {list.map((url) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <button type="button" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white" onClick={() => remove(url)}>
              ✕
            </button>
          </div>
        ))}
        <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-400 hover:border-brand">
          {uploading ? "…" : "+"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(e) => {
              const fs = e.target.files;
              if (fs && fs.length) upload(fs);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function ToolManuals({ toolId, manuals }: { toolId: string; manuals: { url: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [list, setList] = useState(manuals);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("manual", file);
    const res = await uploadToolManual(toolId, fd);
    setUploading(false);
    if (res.ok) {
      setList(res.data.manuals);
      toast("Manuál pridaný.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }
  async function remove(url: string) {
    const res = await deleteToolManual(toolId, url);
    if (res.ok) {
      setList(res.data.manuals);
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Manuály (PDF)</div>
      <div className="space-y-1">
        {list.map((m) => (
          <div key={m.url} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-1.5 text-sm">
            <span className="truncate text-slate-700">📄 {m.name}</span>
            <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => remove(m.url)}>
              Odstrániť
            </button>
          </div>
        ))}
      </div>
      <label className="btn-secondary mt-2 inline-flex cursor-pointer text-xs">
        {uploading ? "Nahrávam…" : "+ Nahrať PDF manuál"}
        <input type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      </label>
    </div>
  );
}

function ToolVideos({ toolId, videos }: { toolId: string; videos: string[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [list, setList] = useState<string[]>(videos);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist(next: string[]) {
    setSaving(true);
    const res = await saveToolVideos(toolId, next);
    setSaving(false);
    if (res.ok) {
      setList(next);
      router.refresh();
    } else toast(res.error ?? "Chyba", "error");
  }

  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Videá (YouTube odkazy)</div>
      <div className="space-y-1">
        {list.map((v) => (
          <div key={v} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-1.5 text-sm">
            <span className="truncate text-slate-700">▶ {v}</span>
            <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => persist(list.filter((x) => x !== v))} disabled={saving}>
              Odstrániť
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="input text-sm" placeholder="https://www.youtube.com/watch?v=…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={!input.trim() || saving}
          onClick={() => {
            const url = input.trim();
            if (url) persist([...list, url]);
            setInput("");
          }}
        >
          Pridať
        </button>
      </div>
    </div>
  );
}

function ImageUpload({
  imageUrl,
  onUpload,
}: {
  imageUrl: string | null;
  onUpload: (fd: FormData) => Promise<ActionResult<{ url: string }>>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [img, setImg] = useState(imageUrl);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await onUpload(fd);
    setUploading(false);
    if (res.ok) {
      setImg(res.data.url);
      toast("Obrázok nahraný.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover" />
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
