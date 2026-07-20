"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  saveCompanySettings,
  saveSmtpSettings,
  uploadLogo,
  testSmtpConnection,
  sendTestEmail,
} from "./actions";

interface CompanyForm {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  ico: string;
  dic: string;
  icDph: string;
  vatPayer: boolean;
  vatPayerSince: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string | null;
  brandLight: string;
  brandDark: string;
  defaultVatRate: string;
  quotationValidityDays: number;
  quotationPrefix: string;
  protocolPrefix: string;
  quotationEmailSubject: string;
  quotationEmailBody: string;
  protocolEmailSubject: string;
  protocolEmailBody: string;
}

interface SmtpForm {
  host: string | null;
  port: number;
  secure: boolean;
  username: string | null;
  senderName: string;
  senderEmail: string;
  replyTo: string | null;
  hasPassword: boolean;
  passwordMasked: string;
}

const TABS = [
  "Firemné údaje",
  "Branding",
  "Číslovanie",
  "SMTP",
  "E-mailové šablóny",
  "Používatelia",
  "Systémové informácie",
];

export function SettingsClient({ company, smtp }: { company: CompanyForm; smtp: SmtpForm }) {
  const [tab, setTab] = useState(0);
  const [c, setC] = useState(company);
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const setField = (k: keyof CompanyForm, v: string | number | boolean) => setC({ ...c, [k]: v });

  async function saveCompany() {
    setSaving(true);
    const res = await saveCompanySettings({
      ...c,
      vatPayerSince: c.vatPayerSince || null,
      defaultVatRate: Number(c.defaultVatRate),
      quotationValidityDays: Number(c.quotationValidityDays),
    });
    setSaving(false);
    if (res.ok) {
      toast("Nastavenia uložené.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === i ? "border-brand-dark text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="card space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Názov spoločnosti" value={c.name} onChange={(v) => setField("name", v)} />
            <Input label="E-mail" value={c.email} onChange={(v) => setField("email", v)} />
            <Input label="Ulica a číslo" value={c.street} onChange={(v) => setField("street", v)} />
            <Input label="Mesto" value={c.city} onChange={(v) => setField("city", v)} />
            <Input label="PSČ" value={c.postalCode} onChange={(v) => setField("postalCode", v)} />
            <Input label="Krajina" value={c.country} onChange={(v) => setField("country", v)} />
            <Input label="IČO" value={c.ico} onChange={(v) => setField("ico", v)} />
            <Input label="DIČ" value={c.dic} onChange={(v) => setField("dic", v)} />
            <Input label="IČ DPH" value={c.icDph} onChange={(v) => setField("icDph", v)} />
            <Input label="Telefón" value={c.phone} onChange={(v) => setField("phone", v)} />
            <Input label="Web" value={c.website} onChange={(v) => setField("website", v)} />
            <Input label="Platca DPH od" type="date" value={c.vatPayerSince} onChange={(v) => setField("vatPayerSince", v)} />
            <label className="flex items-center gap-2 pt-7 text-sm text-slate-600">
              <input type="checkbox" checked={c.vatPayer} onChange={(e) => setField("vatPayer", e.target.checked)} /> Platca DPH
            </label>
          </div>
          <SaveBar onSave={saveCompany} saving={saving} />
        </div>
      )}

      {tab === 1 && (
        <div className="card space-y-5 p-6">
          <LogoUploader logoUrl={c.logoUrl} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Svetlá farba</label>
              <div className="flex gap-2">
                <input type="color" value={c.brandLight} onChange={(e) => setField("brandLight", e.target.value)} className="h-10 w-14 rounded border border-slate-300" />
                <input className="input" value={c.brandLight} onChange={(e) => setField("brandLight", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Tmavá farba</label>
              <div className="flex gap-2">
                <input type="color" value={c.brandDark} onChange={(e) => setField("brandDark", e.target.value)} className="h-10 w-14 rounded border border-slate-300" />
                <input className="input" value={c.brandDark} onChange={(e) => setField("brandDark", e.target.value)} />
              </div>
            </div>
          </div>
          <SaveBar onSave={saveCompany} saving={saving} />
        </div>
      )}

      {tab === 2 && (
        <div className="card space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Predpona cenových ponúk" value={c.quotationPrefix} onChange={(v) => setField("quotationPrefix", v)} />
            <Input label="Predpona protokolov" value={c.protocolPrefix} onChange={(v) => setField("protocolPrefix", v)} />
            <Input label="Predvolená sadzba DPH (%)" type="number" value={c.defaultVatRate} onChange={(v) => setField("defaultVatRate", v)} />
            <Input label="Predvolená platnosť ponuky (dni)" type="number" value={String(c.quotationValidityDays)} onChange={(v) => setField("quotationValidityDays", Number(v))} />
          </div>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Zmena predpony ovplyvní len nové dokumenty. Existujúce čísla dokumentov zostanú nezmenené.
          </p>
          <SaveBar onSave={saveCompany} saving={saving} />
        </div>
      )}

      {tab === 3 && <SmtpTab smtp={smtp} />}

      {tab === 4 && (
        <div className="card space-y-5 p-6">
          <div>
            <label className="label">Predmet – cenová ponuka</label>
            <input className="input" value={c.quotationEmailSubject} onChange={(e) => setField("quotationEmailSubject", e.target.value)} />
          </div>
          <div>
            <label className="label">Text e-mailu – cenová ponuka</label>
            <textarea className="input" rows={7} value={c.quotationEmailBody} onChange={(e) => setField("quotationEmailBody", e.target.value)} />
          </div>
          <div>
            <label className="label">Predmet – protokol</label>
            <input className="input" value={c.protocolEmailSubject} onChange={(e) => setField("protocolEmailSubject", e.target.value)} />
          </div>
          <div>
            <label className="label">Text e-mailu – protokol</label>
            <textarea className="input" rows={6} value={c.protocolEmailBody} onChange={(e) => setField("protocolEmailBody", e.target.value)} />
          </div>
          <p className="text-xs text-slate-400">
            Premenné: {"{{documentNumber}}"}, {"{{validUntil}}"} (len cenová ponuka).
          </p>
          <SaveBar onSave={saveCompany} saving={saving} />
        </div>
      )}

      {tab === 5 && (
        <div className="card p-6">
          <p className="text-sm text-slate-600">Správa administrátorských účtov je na samostatnej stránke.</p>
          <Link href="/pouzivatelia" className="btn-primary mt-3 inline-flex">
            Prejsť na Používateľov
          </Link>
        </div>
      )}

      {tab === 6 && (
        <div className="card space-y-2 p-6 text-sm text-slate-600">
          <Row label="Aplikácia" value="AQUALIFE SERVIS – Evidencia" />
          <Row label="Verzia" value="1.0.0" />
          <Row label="Lokalizácia" value="sk-SK · EUR · Europe/Bratislava" />
          <Row label="Predvolená DPH" value={`${c.defaultVatRate} %`} />
          <Row label="Úložisko dokumentov" value="Vercel Blob" />
        </div>
      )}
    </div>
  );
}

function SmtpTab({ smtp }: { smtp: SmtpForm }) {
  const { toast } = useToast();
  const [s, setS] = useState({
    host: smtp.host ?? "",
    port: smtp.port,
    secure: smtp.secure,
    username: smtp.username ?? "",
    password: "",
    senderName: smtp.senderName,
    senderEmail: smtp.senderEmail,
    replyTo: smtp.replyTo ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  async function save() {
    setSaving(true);
    const res = await saveSmtpSettings(s);
    setSaving(false);
    if (res.ok) toast("SMTP uložené.", "success");
    else toast(res.error, "error");
  }
  async function testConn() {
    setTesting(true);
    const res = await testSmtpConnection();
    setTesting(false);
    if (res.ok) toast("Pripojenie úspešné.", "success");
    else toast(res.error, "error");
  }
  async function testMail() {
    const res = await sendTestEmail({ recipient: testEmail });
    if (res.ok) toast("Testovací e-mail odoslaný.", "success");
    else toast(res.error, "error");
  }

  return (
    <div className="card space-y-4 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="SMTP server" value={s.host} onChange={(v) => setS({ ...s, host: v })} />
        <Input label="Port" type="number" value={String(s.port)} onChange={(v) => setS({ ...s, port: Number(v) })} />
        <Input label="Používateľské meno" value={s.username} onChange={(v) => setS({ ...s, username: v })} />
        <div>
          <label className="label">Heslo</label>
          <input
            type="password"
            className="input"
            placeholder={smtp.hasPassword ? "•••••••• (nezmenené)" : "Zadajte heslo"}
            value={s.password}
            onChange={(e) => setS({ ...s, password: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-400">Heslo sa ukladá šifrované a nikdy sa nezobrazuje.</p>
        </div>
        <Input label="Meno odosielateľa" value={s.senderName} onChange={(v) => setS({ ...s, senderName: v })} />
        <Input label="E-mail odosielateľa" value={s.senderEmail} onChange={(v) => setS({ ...s, senderEmail: v })} />
        <Input label="Odpovedať na (Reply-To)" value={s.replyTo} onChange={(v) => setS({ ...s, replyTo: v })} />
        <label className="flex items-center gap-2 pt-7 text-sm text-slate-600">
          <input type="checkbox" checked={s.secure} onChange={(e) => setS({ ...s, secure: e.target.checked })} /> Zabezpečené (TLS/SSL)
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Ukladám…" : "Uložiť SMTP"}
        </button>
        <button className="btn-secondary" onClick={testConn} disabled={testing}>
          {testing ? "Testujem…" : "Test pripojenia"}
        </button>
        <div className="ml-auto flex gap-2">
          <input className="input max-w-[220px]" placeholder="test@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
          <button className="btn-secondary" onClick={testMail} disabled={!testEmail}>
            Odoslať testovací e-mail
          </button>
        </div>
      </div>
    </div>
  );
}

function LogoUploader({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("logo", file);
    const res = await uploadLogo(fd);
    setUploading(false);
    if (res.ok) {
      toast("Logo nahrané.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-16 max-w-16 object-contain" />
        ) : (
          <span className="text-xs text-slate-400">Bez loga</span>
        )}
      </div>
      <div>
        <label className="btn-secondary cursor-pointer">
          {uploading ? "Nahrávam…" : "Nahrať logo"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        <p className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP, SVG · max 2 MB</p>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end border-t border-slate-100 pt-4">
      <button className="btn-primary" onClick={onSave} disabled={saving}>
        {saving ? "Ukladám…" : "Uložiť zmeny"}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
