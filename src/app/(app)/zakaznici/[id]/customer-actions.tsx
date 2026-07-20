"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { archiveCustomer } from "../actions";

export function CustomerActions({ customerId, archived }: { customerId: string; archived: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);

  async function handleArchive() {
    const res = await archiveCustomer(customerId, !archived);
    if (res.ok) {
      toast(archived ? "Zákazník obnovený." : "Zákazník archivovaný.", "success");
      router.refresh();
    } else {
      toast(res.error, "error");
    }
    setConfirm(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/cenove-ponuky/nova?customerId=${customerId}`} className="btn-secondary">
        Nová ponuka
      </Link>
      <Link href={`/protokoly/novy?customerId=${customerId}`} className="btn-secondary">
        Nový protokol
      </Link>
      <Link href={`/zakaznici/${customerId}/upravit`} className="btn-secondary">
        Upraviť
      </Link>
      <button className="btn-ghost" onClick={() => setConfirm(true)}>
        {archived ? "Obnoviť" : "Archivovať"}
      </button>

      <ConfirmDialog
        open={confirm}
        title={archived ? "Obnoviť zákazníka?" : "Archivovať zákazníka?"}
        message={
          archived
            ? "Zákazník sa vráti medzi aktívne záznamy."
            : "Zákazník bude presunutý do archívu. História dokumentov zostane zachovaná."
        }
        confirmLabel={archived ? "Obnoviť" : "Archivovať"}
        danger={!archived}
        onConfirm={handleArchive}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
