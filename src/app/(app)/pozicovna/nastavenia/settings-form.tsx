"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { saveRentalSettings } from "../actions";

interface Settings {
  deliveryPricePerKm: string;
  maxDeliveryKm: number;
  minRentalDays: number;
  publicIntro: string;
  termsText: string;
  contactEmail: string;
  contactPhone: string;
  ownerNotifyEmail: string;
  customerEmailSubject: string;
  customerEmailBody: string;
  approvedEmailSubject: string;
  approvedEmailBody: string;
  rejectedEmailSubject: string;
  rejectedEmailBody: string;
}

export function RentalSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [s, setS] = useState(settings);
  const [saving, setSaving] = useState(false);

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
        <h3 className="text-sm font-semibold text-slate-700">E-mailové šablóny</h3>
        <p className="text-xs text-slate-400">Premenné: {"{{number}}, {{toolName}}, {{startDate}}, {{endDate}}, {{price}}"}</p>
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
