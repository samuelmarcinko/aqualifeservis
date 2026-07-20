"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";
import {
  finalizeQuotationAction,
  createRevisionAction,
  changeStatusAction,
  sendQuotationAction,
} from "../actions";

interface Props {
  id: string;
  number: string;
  revision: number;
  locked: boolean;
  status: string;
  recipient: string;
  defaultSubject: string;
  defaultMessage: string;
  fileName: string;
}

export function QuotationActions(props: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmRevision, setConfirmRevision] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      toast(success, "success");
      router.refresh();
    } else toast(res.error ?? "Chyba", "error");
    return res.ok;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/api/quotations/${props.id}/preview`} target="_blank" rel="noreferrer" className="btn-secondary">
        Náhľad PDF
      </a>

      {!props.locked && (
        <Link href={`/cenove-ponuky/${props.id}/upravit`} className="btn-secondary">
          Upraviť
        </Link>
      )}

      {!props.locked ? (
        <button className="btn-primary" onClick={() => setConfirmFinalize(true)} disabled={busy}>
          Finalizovať
        </button>
      ) : (
        <a href={`/api/quotations/${props.id}/pdf?revision=${props.revision}`} className="btn-primary">
          Stiahnuť finálne PDF
        </a>
      )}

      {props.locked && (
        <button className="btn-secondary" onClick={() => setSendOpen(true)} disabled={busy}>
          Odoslať e-mailom
        </button>
      )}

      {props.locked && (
        <button className="btn-secondary" onClick={() => setConfirmRevision(true)} disabled={busy}>
          Vytvoriť novú revíziu
        </button>
      )}

      <button className="btn-ghost" onClick={() => setStatusOpen(true)} disabled={busy}>
        Zmeniť stav
      </button>

      <ConfirmDialog
        open={confirmFinalize}
        title="Finalizovať cenovú ponuku?"
        message="Po finalizácii sa dokument uzamkne a vytvorí sa uložený PDF. Ďalšie úpravy budú vyžadovať novú revíziu."
        confirmLabel="Finalizovať"
        onConfirm={async () => {
          const okr = await run(() => finalizeQuotationAction(props.id), "Ponuka finalizovaná.");
          if (okr) setConfirmFinalize(false);
        }}
        onCancel={() => setConfirmFinalize(false)}
      />

      <ConfirmDialog
        open={confirmRevision}
        title="Vytvoriť novú revíziu?"
        message="Vytvorí sa nová upraviteľná revízia. Predchádzajúca revízia a jej PDF zostanú zachované."
        confirmLabel="Vytvoriť revíziu"
        onConfirm={async () => {
          const okr = await run(() => createRevisionAction(props.id), "Nová revízia vytvorená.");
          if (okr) {
            setConfirmRevision(false);
            router.push(`/cenove-ponuky/${props.id}/upravit`);
          }
        }}
        onCancel={() => setConfirmRevision(false)}
      />

      {sendOpen && (
        <SendModal
          {...props}
          onClose={() => setSendOpen(false)}
          onSent={() => {
            setSendOpen(false);
            router.refresh();
          }}
        />
      )}

      {statusOpen && (
        <StatusModal
          id={props.id}
          current={props.status}
          onClose={() => setStatusOpen(false)}
          onChanged={() => {
            setStatusOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function SendModal(props: Props & { onClose: () => void; onSent: () => void }) {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState(props.recipient);
  const [subject, setSubject] = useState(props.defaultSubject);
  const [message, setMessage] = useState(props.defaultMessage);
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    const res = await sendQuotationAction(props.id, { recipient, subject, message, revision: props.revision });
    setSending(false);
    if (res.ok) {
      toast("E-mail odoslaný.", "success");
      props.onSent();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={props.onClose}
      title="Odoslať cenovú ponuku"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={props.onClose} disabled={sending}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={send} disabled={sending || !recipient}>
            {sending ? "Odosielam…" : "Odoslať"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Príjemca</label>
          <input className="input" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        </div>
        <div>
          <label className="label">Predmet</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="label">Správa</label>
          <textarea className="input" rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span>📎</span>
          <span>{props.fileName} · revízia {props.revision}</span>
        </div>
      </div>
    </Modal>
  );
}

function StatusModal({
  id,
  current,
  onClose,
  onChanged,
}: {
  id: string;
  current: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await changeStatusAction(id, status);
    setSaving(false);
    if (res.ok) {
      toast("Stav zmenený.", "success");
      onChanged();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Zmeniť stav"
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            Uložiť
          </button>
        </>
      }
    >
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        {Object.entries(QUOTATION_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </Modal>
  );
}
