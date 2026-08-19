"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { PHOTO_CATEGORY_LABELS, MAX_PHOTOS_PER_PROTOCOL } from "@/lib/constants";
import { updatePhotoAction, reorderPhotosAction, deletePhotoAction } from "../actions";

interface Photo {
  id: string;
  blobUrl: string;
  fileName: string;
  category: string;
  caption: string | null;
  includeInPdf: boolean;
  position: number;
}

export function PhotoManager({
  protocolId,
  photos,
  locked,
}: {
  protocolId: string;
  photos: Photo[];
  locked: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<Photo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [order, setOrder] = useState<Photo[]>(photos);
  const dragIdx = useRef<number | null>(null);

  // Keep local order in sync when server data changes.
  if (photos.map((p) => p.id).join() !== order.map((p) => p.id).join() && dragIdx.current === null) {
    // Only resync if not mid-drag.
    if (photos.length !== order.length) setOrder(photos);
  }

  async function handleFiles(files: FileList) {
    if (locked) return;
    const remaining = MAX_PHOTOS_PER_PROTOCOL - photos.length;
    const list = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast(`Možno pridať už len ${remaining} fotografií.`, "error");
    }
    setUploading(true);
    setProgress(0);
    let done = 0;
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/protocols/${protocolId}/photos`, { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Nahrávanie zlyhalo." }));
        toast(data.error ?? "Nahrávanie zlyhalo.", "error");
      }
      done++;
      setProgress(Math.round((done / list.length) * 100));
    }
    setUploading(false);
    router.refresh();
  }

  async function patch(photoId: string, p: { category?: string; caption?: string; includeInPdf?: boolean }) {
    // Optimistically update local state so the control reflects the change
    // immediately (the list renders from `order`, not the server prop).
    setOrder((prev) => prev.map((x) => (x.id === photoId ? { ...x, ...p } : x)));
    const res = await updatePhotoAction(protocolId, photoId, p);
    if (res.ok) router.refresh();
    else toast(res.error, "error");
  }

  async function onDrop(targetIdx: number) {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from === null || from === targetIdx) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(targetIdx, 0, moved);
    setOrder(next);
    const res = await reorderPhotosAction(protocolId, next.map((p) => p.id));
    if (res.ok) router.refresh();
    else toast(res.error, "error");
  }

  async function doDelete() {
    if (!deleteId) return;
    const res = await deletePhotoAction(protocolId, deleteId);
    if (res.ok) {
      toast("Fotografia odstránená.", "success");
      router.refresh();
    } else toast(res.error, "error");
    setDeleteId(null);
  }

  return (
    <div>
      {!locked && (
        <div className="mb-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center hover:border-brand"
          >
            <p className="text-sm font-medium text-slate-600">Kliknite alebo presuňte fotografie sem</p>
            <p className="text-xs text-slate-400">JPG, PNG, WEBP · max 10 MB · do {MAX_PHOTOS_PER_PROTOCOL} ks ({photos.length}/{MAX_PHOTOS_PER_PROTOCOL})</p>
          </div>
          {uploading && (
            <div className="mt-2 h-2 overflow-hidden rounded bg-slate-200">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {order.length === 0 ? (
        <p className="text-sm text-slate-400">Zatiaľ žiadne fotografie.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((p, idx) => (
            <div
              key={p.id}
              draggable={!locked}
              onDragStart={() => (dragIdx.current = idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(idx)}
              className="card overflow-hidden"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.blobUrl}
                  alt={p.caption ?? p.fileName}
                  className="h-40 w-full cursor-pointer object-cover"
                  onClick={() => setPreview(p)}
                />
                {!p.includeInPdf && (
                  <span className="absolute right-2 top-2 badge bg-slate-800/80 text-white">Nezahrnúť</span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <select
                  className="input py-1 text-xs"
                  value={p.category}
                  disabled={locked}
                  onChange={(e) => patch(p.id, { category: e.target.value })}
                >
                  {Object.entries(PHOTO_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input
                  className="input py-1 text-xs"
                  placeholder="Popis fotografie"
                  defaultValue={p.caption ?? ""}
                  disabled={locked}
                  onBlur={(e) => e.target.value !== (p.caption ?? "") && patch(p.id, { caption: e.target.value })}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={p.includeInPdf}
                      disabled={locked}
                      onChange={(e) => patch(p.id, { includeInPdf: e.target.checked })}
                    />
                    Zahrnúť do PDF
                  </label>
                  {!locked && (
                    <button className="text-xs text-red-500 hover:underline" onClick={() => setDeleteId(p.id)}>
                      Odstrániť
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <Modal open onClose={() => setPreview(null)} size="xl" title={preview.caption ?? preview.fileName}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.blobUrl} alt={preview.caption ?? preview.fileName} className="max-h-[70vh] w-full object-contain" />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Odstrániť fotografiu?"
        message="Fotografia bude natrvalo odstránená."
        danger
        confirmLabel="Odstrániť"
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
