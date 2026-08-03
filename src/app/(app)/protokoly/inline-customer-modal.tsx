"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";
import { createCustomer } from "../zakaznici/actions";

export interface CreatedCustomer {
  id: string;
  name: string;
  addresses: {
    id: string;
    label: string;
    street: string | null;
    city: string | null;
    postalCode: string | null;
    objectType: string | null;
    apartment: string | null;
  }[];
}

export function InlineCustomerModal({
  onClose,
  onCreated,
  initialName,
  initialPhone,
  initialEmail,
}: {
  onClose: () => void;
  onCreated: (c: CreatedCustomer) => void;
  initialName?: string;
  initialPhone?: string;
  initialEmail?: string;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const nameParts = (initialName ?? "").trim().split(/\s+/).filter(Boolean);
  const [f, setF] = useState({
    type: "PERSON" as "PERSON" | "SOLE_TRADER" | "COMPANY",
    firstName: nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : (nameParts[0] ?? ""),
    lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1]! : "",
    businessName: nameParts.length ? initialName!.trim() : "",
    contactPerson: "",
    ico: "",
    dic: "",
    icDph: "",
    vatPayer: false,
    email: initialEmail ?? "",
    phone: initialPhone ?? "",
    street: "",
    city: "",
    postalCode: "",
    // service address / object
    addrLabel: "",
    addrStreet: "",
    addrCity: "",
    addrPostalCode: "",
    addrObjectType: "",
    addrApartment: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const isBusiness = f.type !== "PERSON";

  async function save() {
    setSaving(true);
    const customerInput = {
      type: f.type,
      firstName: f.firstName,
      lastName: f.lastName,
      businessName: f.businessName,
      contactPerson: f.contactPerson,
      ico: f.ico,
      dic: f.dic,
      icDph: f.icDph,
      vatPayer: f.vatPayer,
      email: f.email,
      phone: f.phone,
      street: f.street,
      city: f.city,
      postalCode: f.postalCode,
      country: "Slovensko",
    };
    const addressInput = f.addrLabel.trim()
      ? {
          label: f.addrLabel,
          street: f.addrStreet,
          city: f.addrCity,
          postalCode: f.addrPostalCode,
          objectType: f.addrObjectType,
          apartment: f.addrApartment,
          country: "Slovensko",
        }
      : undefined;

    const res = await createCustomer(customerInput, addressInput);
    setSaving(false);
    if (res.ok) {
      toast("Zákazník vytvorený.", "success");
      onCreated({
        id: res.data.id,
        name: res.data.name,
        addresses: res.data.addressId
          ? [
              {
                id: res.data.addressId,
                label: f.addrLabel,
                street: f.addrStreet || null,
                city: f.addrCity || null,
                postalCode: f.addrPostalCode || null,
                objectType: f.addrObjectType || null,
                apartment: f.addrApartment || null,
              },
            ]
          : [],
      });
    } else toast(res.error, "error");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nový zákazník"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Zrušiť
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Vytváram…" : "Vytvoriť a vybrať"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(CUSTOMER_TYPE_LABELS) as (keyof typeof CUSTOMER_TYPE_LABELS)[]).map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <input type="radio" name="ctype" checked={f.type === k} onChange={() => setF({ ...f, type: k as typeof f.type })} />
              {CUSTOMER_TYPE_LABELS[k]}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!isBusiness ? (
            <>
              <input className="input" placeholder="Meno *" value={f.firstName} onChange={set("firstName")} />
              <input className="input" placeholder="Priezvisko *" value={f.lastName} onChange={set("lastName")} />
            </>
          ) : (
            <>
              <input className="input sm:col-span-2" placeholder="Obchodný názov *" value={f.businessName} onChange={set("businessName")} />
              <input className="input" placeholder="Kontaktná osoba" value={f.contactPerson} onChange={set("contactPerson")} />
              <input className="input" placeholder="IČO" value={f.ico} onChange={set("ico")} />
              <input className="input" placeholder="DIČ" value={f.dic} onChange={set("dic")} />
              <input className="input" placeholder="IČ DPH" value={f.icDph} onChange={set("icDph")} />
            </>
          )}
          <input type="email" className="input" placeholder="E-mail" value={f.email} onChange={set("email")} />
          <input className="input" placeholder="Telefón" value={f.phone} onChange={set("phone")} />
          <input className="input" placeholder={isBusiness ? "Sídlo – ulica a číslo" : "Adresa – ulica a číslo"} value={f.street} onChange={set("street")} />
          <input className="input" placeholder="Mesto" value={f.city} onChange={set("city")} />
          <input className="input" placeholder="PSČ" value={f.postalCode} onChange={set("postalCode")} />
        </div>

        <div className="border-t border-slate-100 pt-3">
          <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Servisná adresa / objekt (voliteľné)</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="input sm:col-span-2" placeholder="Označenie (napr. Rodinný dom Kamenica)" value={f.addrLabel} onChange={set("addrLabel")} />
            <input className="input sm:col-span-2" placeholder="Ulica a číslo" value={f.addrStreet} onChange={set("addrStreet")} />
            <input className="input" placeholder="Mesto" value={f.addrCity} onChange={set("addrCity")} />
            <input className="input" placeholder="PSČ" value={f.addrPostalCode} onChange={set("addrPostalCode")} />
            <input className="input" placeholder="Typ objektu" value={f.addrObjectType} onChange={set("addrObjectType")} />
            <input className="input" placeholder="Číslo bytu / poschodie" value={f.addrApartment} onChange={set("addrApartment")} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
