"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import { createAdmin, setUserActive, changeUserRole, resetUserPassword } from "./actions";

interface U {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export function UsersManager({ users, currentUserId }: { users: U[]; currentUserId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [pwUser, setPwUser] = useState<U | null>(null);

  async function toggleActive(u: U) {
    const res = await setUserActive(u.id, !u.active);
    if (res.ok) {
      toast("Uložené.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }
  async function switchRole(u: U, role: string) {
    const res = await changeUserRole(u.id, role);
    if (res.ok) {
      toast("Rola zmenená.", "success");
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          Nový používateľ
        </button>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Meno</th>
              <th>E-mail</th>
              <th>Rola</th>
              <th>Stav</th>
              <th>Vytvorený</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-slate-800">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-slate-400">(vy)</span>}
                </td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="input py-1 text-xs"
                    value={u.role}
                    disabled={u.id === currentUserId}
                    onChange={(e) => switchRole(u, e.target.value)}
                  >
                    <option value="SUPER_ADMIN">Super administrátor</option>
                    <option value="ADMIN">Administrátor</option>
                  </select>
                </td>
                <td>
                  {u.active ? (
                    <span className="badge bg-emerald-100 text-emerald-800">Aktívny</span>
                  ) : (
                    <span className="badge bg-slate-200 text-slate-600">Neaktívny</span>
                  )}
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td className="text-right">
                  <button className="btn-secondary py-1 text-xs" onClick={() => setPwUser(u)}>
                    Heslo
                  </button>
                  {u.id !== currentUserId && (
                    <button className="btn-ghost py-1 text-xs" onClick={() => toggleActive(u)}>
                      {u.active ? "Deaktivovať" : "Aktivovať"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
      {pwUser && <PasswordModal user={pwUser} onClose={() => setPwUser(null)} />}
    </div>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });

  async function save() {
    setSaving(true);
    const res = await createAdmin(form);
    setSaving(false);
    if (res.ok) {
      toast("Používateľ vytvorený.", "success");
      onClose();
      router.refresh();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nový používateľ"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Vytváram…" : "Vytvoriť"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Meno</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Heslo</label>
          <input type="text" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p className="mt-1 text-xs text-slate-400">Min. 10 znakov, veľké aj malé písmeno a číslica.</p>
        </div>
        <div>
          <label className="label">Rola</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="ADMIN">Administrátor</option>
            <option value="SUPER_ADMIN">Super administrátor</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function PasswordModal({ user, onClose }: { user: U; onClose: () => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await resetUserPassword(user.id, { password });
    setSaving(false);
    if (res.ok) {
      toast("Heslo nastavené.", "success");
      onClose();
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Nové heslo · ${user.name}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !password}>
            {saving ? "Ukladám…" : "Nastaviť heslo"}
          </button>
        </>
      }
    >
      <label className="label">Nové heslo</label>
      <input type="text" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p className="mt-1 text-xs text-slate-400">Používateľ bude odhlásený zo všetkých relácií.</p>
    </Modal>
  );
}
