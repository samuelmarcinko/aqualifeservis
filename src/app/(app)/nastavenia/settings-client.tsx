"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm";
import {
  saveCompanySettings,
  saveSmtpSettings,
  uploadLogo,
  uploadStamp,
  removeStamp,
  testSmtpConnection,
  sendTestEmail,
  deleteAllQuotationsAction,
  deleteAllProtocolsAction,
  resetNumberingAction,
  saveAiSettings,
  testAi,
} from "./actions";

interface SafeAi {
  provider: string;
  model: string;
  enabled: boolean;
  hasKey: boolean;
}

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
  stampUrl: string | null;
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
  "AI asistent",
  "Systémové informácie",
  "Údržba",
];

export function SettingsClient({
  company,
  smtp,
  ai,
}: {
  company: CompanyForm;
  smtp: SmtpForm;
  ai: SafeAi;
}) {
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
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Logo</h3>
            <LogoUploader logoUrl={c.logoUrl} />
          </div>
          <div className="border-t border-slate-100 pt-5">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Pečiatka / elektronický podpis</h3>
            <p className="mb-2 text-xs text-slate-400">
              Použije sa na strane dodávateľa vo finalizovanom PDF protokole. Ideálne PNG s priehľadným pozadím.
            </p>
            <StampUploader stampUrl={c.stampUrl} />
          </div>
          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
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

      {tab === 6 && <AiTab ai={ai} />}

      {tab === 7 && (
        <div className="card space-y-2 p-6 text-sm text-slate-600">
          <Row label="Aplikácia" value="AQUALIFE SERVIS – Evidencia" />
          <Row label="Verzia" value="1.0.0" />
          <Row label="Lokalizácia" value="sk-SK · EUR · Europe/Bratislava" />
          <Row label="Predvolená DPH" value={`${c.defaultVatRate} %`} />
          <Row label="Úložisko dokumentov" value="Vercel Blob" />
        </div>
      )}

      {tab === 8 && <DangerZone />}
    </div>
  );
}

function AiTab({ ai }: { ai: SafeAi }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(ai.enabled);
  const [model, setModel] = useState(ai.model);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function save() {
    setSaving(true);
    const res = await saveAiSettings({ enabled, model, apiKey });
    setSaving(false);
    if (res.ok) {
      toast("AI nastavenia uložené.", "success");
      setApiKey("");
    } else toast(res.error, "error");
  }
  async function test() {
    setTesting(true);
    const res = await testAi();
    setTesting(false);
    if (res.ok) toast("AI funguje správne. ✨", "success");
    else toast(res.error, "error");
  }

  return (
    <div className="card space-y-4 p-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">AI asistent (Google Gemini)</h3>
        <p className="mt-1 text-xs text-slate-400">
          Umožňuje z voľného textu alebo hlasového diktovania automaticky vyplniť polia protokolu
          profesionálnym slovenským textom. API kľúč získate zdarma na{" "}
          <span className="font-medium">aistudio.google.com</span>.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Zapnúť AI asistenta
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Model</label>
          <input className="input" list="gemini-models" value={model} onChange={(e) => setModel(e.target.value)} />
          <datalist id="gemini-models">
            <option value="gemini-2.5-flash" />
            <option value="gemini-2.5-flash-lite" />
            <option value="gemini-2.5-pro" />
            <option value="gemini-flash-latest" />
          </datalist>
          <p className="mt-1 text-xs text-slate-400">Odporúčané: gemini-2.5-flash</p>
        </div>
        <div>
          <label className="label">API kľúč</label>
          <input
            type="password"
            className="input"
            placeholder={ai.hasKey ? "•••••••• (nezmenené)" : "Vložte Gemini API kľúč"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">Ukladá sa šifrovaný, nikdy sa nezobrazuje.</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Upozornenie: pri použití AI sa text/hlas (vrátane údajov klienta) odosiela do služby Google
        Gemini. Na free tieri môže Google dáta použiť na zlepšovanie modelov — pre reálne klientske
        dáta zvážte platený tier s garanciou netréningovania.
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Ukladám…" : "Uložiť"}
        </button>
        <button className="btn-secondary" onClick={test} disabled={testing || (!ai.hasKey && !apiKey)}>
          {testing ? "Testujem…" : "Test AI"}
        </button>
      </div>
    </div>
  );
}

function DangerZone() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<null | "quotations" | "protocols" | "numbering">(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    let res;
    if (confirm === "quotations") res = await deleteAllQuotationsAction();
    else if (confirm === "protocols") res = await deleteAllProtocolsAction();
    else if (confirm === "numbering") res = await resetNumberingAction();
    setBusy(false);
    if (res?.ok) {
      toast("Hotovo.", "success");
      router.refresh();
    } else toast(res?.error ?? "Chyba", "error");
    setConfirm(null);
  }

  return (
    <div className="card border-red-200 p-6">
      <h3 className="text-base font-semibold text-red-700">Nebezpečná zóna</h3>
      <p className="mb-4 text-sm text-slate-500">
        Tieto akcie sú nevratné. Slúžia na vyčistenie testovacích údajov.
      </p>
      <div className="divide-y divide-slate-100">
        <DangerRow
          title="Vymazať všetky cenové ponuky"
          desc="Odstráni všetky cenové ponuky vrátane revízií a PDF."
          onClick={() => setConfirm("quotations")}
        />
        <DangerRow
          title="Vymazať všetky protokoly"
          desc="Odstráni všetky protokoly vrátane fotografií a PDF."
          onClick={() => setConfirm("protocols")}
        />
        <DangerRow
          title="Vynulovať číslovanie dokumentov"
          desc="Číslovanie začne opäť od 0001. Možné až po vymazaní všetkých ponúk aj protokolov."
          onClick={() => setConfirm("numbering")}
        />
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Naozaj pokračovať?"
        message={
          confirm === "quotations"
            ? "Natrvalo budú vymazané VŠETKY cenové ponuky. Túto akciu nie je možné vrátiť späť."
            : confirm === "protocols"
              ? "Natrvalo budú vymazané VŠETKY protokoly vrátane fotografií. Túto akciu nie je možné vrátiť späť."
              : "Číslovanie sa vynuluje na 0001."
        }
        danger
        confirmLabel={busy ? "Spracúvam…" : "Áno, pokračovať"}
        onConfirm={run}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function DangerRow({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-slate-800">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      <button className="btn-danger py-1.5 text-xs" onClick={onClick}>
        Vymazať
      </button>
    </div>
  );
}

function StampUploader({ stampUrl }: { stampUrl: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("stamp", file);
    const res = await uploadStamp(fd);
    setUploading(false);
    if (res.ok) {
      toast("Pečiatka nahraná.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }
  async function remove() {
    const res = await removeStamp();
    if (res.ok) {
      toast("Pečiatka odstránená.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        {stampUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stampUrl} alt="Pečiatka" className="max-h-16 max-w-24 object-contain" />
        ) : (
          <span className="text-xs text-slate-400">Bez pečiatky</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="btn-secondary cursor-pointer">
          {uploading ? "Nahrávam…" : "Nahrať pečiatku"}
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        {stampUrl && (
          <button className="btn-ghost py-1 text-xs text-red-600" onClick={remove}>
            Odstrániť pečiatku
          </button>
        )}
      </div>
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
