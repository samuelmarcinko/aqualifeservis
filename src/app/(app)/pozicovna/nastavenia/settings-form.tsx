"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  saveRentalSettings,
  uploadPickupPhoto,
  deletePickupPhoto,
  uploadHeroImage,
  deleteHeroImage,
} from "../actions";

interface Settings {
  deliveryPricePerKm: string;
  maxDeliveryKm: number;
  minRentalDays: number;
  publicIntro: string;
  termsText: string;
  contactEmail: string;
  contactPhone: string;
  ownerNotifyEmail: string;
  pickupAddress: string;
  pickupNote: string;
  pickupMapEmbed: string;
  facebookUrl: string;
  instagramUrl: string;
  customerEmailSubject: string;
  customerEmailBody: string;
  approvedEmailSubject: string;
  approvedEmailBody: string;
  rejectedEmailSubject: string;
  rejectedEmailBody: string;
}

export function RentalSettingsForm({
  settings,
  pickupPhotos,
  heroImageUrl,
}: {
  settings: Settings;
  pickupPhotos: string[];
  heroImageUrl: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [s, setS] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  async function uploadHero(file: File) {
    setHeroUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await uploadHeroImage(fd);
    setHeroUploading(false);
    if (res.ok) {
      toast("Hero obrázok nahraný.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }
  async function removeHero() {
    const res = await deleteHeroImage();
    if (res.ok) {
      toast("Hero obrázok odstránený.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  async function uploadPhoto(files: FileList) {
    setUploading(true);
    let failed = "";
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await uploadPickupPhoto(fd);
      if (!res.ok) {
        failed = res.error;
        break;
      }
    }
    setUploading(false);
    if (failed) toast(failed, "error");
    else toast("Fotky pridané.", "success");
    router.refresh();
  }
  async function removePhoto(url: string) {
    const res = await deletePickupPhoto(url);
    if (res.ok) {
      toast("Fotka odstránená.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  const set =
    (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setS({ ...s, [k]: e.target.value });

  async function save() {
    setSaving(true);
    const res = await saveRentalSettings(s);
    setSaving(false);
    if (res.ok) {
      toast("Nastavenia uložené.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-semibold text-slate-700">Prevádzka</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Cena dopravy (€/km bez DPH)</label>
            <input type="number" step="0.01" className="input" value={s.deliveryPricePerKm} onChange={set("deliveryPricePerKm")} />
          </div>
          <div>
            <label className="label">Max. vzdialenosť dovozu (km)</label>
            <input type="number" className="input" value={s.maxDeliveryKm} onChange={set("maxDeliveryKm")} />
          </div>
          <div>
            <label className="label">Min. dĺžka prenájmu (dni)</label>
            <input type="number" className="input" value={s.minRentalDays} onChange={set("minRentalDays")} />
          </div>
          <div>
            <label className="label">Kontaktný e-mail (web)</label>
            <input className="input" value={s.contactEmail} onChange={set("contactEmail")} />
          </div>
          <div>
            <label className="label">Kontaktný telefón (web)</label>
            <input className="input" value={s.contactPhone} onChange={set("contactPhone")} />
          </div>
          <div>
            <label className="label">E-mail pre notifikácie majiteľa</label>
            <input className="input" value={s.ownerNotifyEmail} onChange={set("ownerNotifyEmail")} placeholder="ak prázdne, použije sa firemný e-mail" />
          </div>
        </div>
        <div>
          <label className="label">Úvodný text na verejnom webe</label>
          <textarea className="input" rows={3} value={s.publicIntro} onChange={set("publicIntro")} />
        </div>
        <div>
          <label className="label">Podmienky prenájmu (zobrazí sa vo formulári)</label>
          <textarea className="input" rows={3} value={s.termsText} onChange={set("termsText")} />
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-semibold text-slate-700">Vzhľad a sociálne siete (verejný web)</h3>
        <div>
          <label className="label">Hlavný obrázok (hero) na úvodnej stránke</label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="product-frame flex h-24 w-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200">
              {heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImageUrl} alt="Hero" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">Bez obrázka</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className="btn-secondary cursor-pointer text-xs">
                {heroUploading ? "Nahrávam…" : heroImageUrl ? "Zmeniť obrázok" : "Nahrať obrázok"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadHero(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {heroImageUrl && (
                <button type="button" className="btn-ghost text-xs text-red-600" onClick={removeHero}>
                  Odstrániť
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">Zobrazí sa v úvodnom banneri. Ak nič nenahráte, použije sa predvolený obrázok. Odporúčaný pomer je na šírku (napr. 1400×900 px).</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Facebook – odkaz</label>
            <input className="input" value={s.facebookUrl} onChange={set("facebookUrl")} placeholder="https://www.facebook.com/…" />
          </div>
          <div>
            <label className="label">Instagram – odkaz</label>
            <input className="input" value={s.instagramUrl} onChange={set("instagramUrl")} placeholder="https://www.instagram.com/…" />
          </div>
        </div>
        <p className="text-xs text-slate-400">Ak necháte prázdne, príslušná ikona sa v pätičke webu nezobrazí.</p>
      </div>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-semibold text-slate-700">Miesto prevzatia náradia (verejný web)</h3>
        <div>
          <label className="label">Adresa prevzatia</label>
          <input className="input" value={s.pickupAddress} onChange={set("pickupAddress")} placeholder="Strojnícka 20, 080 06 Prešov" />
        </div>
        <div>
          <label className="label">Poznámka / inštrukcie</label>
          <textarea className="input" rows={3} value={s.pickupNote} onChange={set("pickupNote")} placeholder="napr. otváracie hodiny, kontakt, ako sa dostať k prevádzke…" />
        </div>
        <div>
          <label className="label">Google Maps embed URL (voliteľné)</label>
          <input className="input" value={s.pickupMapEmbed} onChange={set("pickupMapEmbed")} placeholder="Ak necháte prázdne, mapa sa vygeneruje z adresy" />
          <p className="mt-1 text-xs text-slate-400">Ak necháte prázdne, mapa sa zobrazí automaticky podľa adresy.</p>
        </div>
        <div>
          <label className="label">Fotky miesta prevzatia</label>
          <div className="flex flex-wrap gap-2">
            {pickupPhotos.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-28 rounded-lg object-cover" />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                  onClick={() => removePhoto(url)}
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-20 w-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-400 hover:border-brand">
              {uploading ? "Nahrávam…" : "+ Fotka"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                multiple
                hidden
                onChange={(e) => {
                  const fs = e.target.files;
                  if (fs && fs.length) uploadPhoto(fs);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-semibold text-slate-700">E-mailové šablóny</h3>
        <p className="text-xs text-slate-400">Premenné: {"{{number}}, {{toolName}}, {{startDate}}, {{endDate}}, {{price}}, {{accessories}}"}</p>
        <p className="text-xs text-slate-400">Ak {"{{accessories}}"} v šablóne neuvediete, rozpis príslušenstva sa doplní automaticky na koniec.</p>
        <EmailPair label="Prijatie rezervácie (zákazníkovi)" subject={s.customerEmailSubject} body={s.customerEmailBody} onSubject={set("customerEmailSubject")} onBody={set("customerEmailBody")} />
        <EmailPair label="Schválenie" subject={s.approvedEmailSubject} body={s.approvedEmailBody} onSubject={set("approvedEmailSubject")} onBody={set("approvedEmailBody")} />
        <EmailPair label="Zamietnutie" subject={s.rejectedEmailSubject} body={s.rejectedEmailBody} onSubject={set("rejectedEmailSubject")} onBody={set("rejectedEmailBody")} />
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Ukladám…" : "Uložiť zmeny"}
        </button>
      </div>
    </div>
  );
}

function EmailPair({
  label,
  subject,
  body,
  onSubject,
  onBody,
}: {
  label: string;
  subject: string;
  body: string;
  onSubject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBody: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="border-t border-slate-100 pt-3">
      <label className="label">{label} – predmet</label>
      <input className="input mb-2" value={subject} onChange={onSubject} />
      <textarea className="input" rows={5} value={body} onChange={onBody} />
    </div>
  );
}
