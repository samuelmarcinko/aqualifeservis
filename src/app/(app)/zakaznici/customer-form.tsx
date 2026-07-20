"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { customerSchema } from "@/lib/validation";
import { createCustomer, updateCustomer } from "./actions";
import { useToast } from "@/components/ui/toast";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";

type FormValues = z.input<typeof customerSchema>;

export function CustomerForm({
  customerId,
  defaultValues,
}: {
  customerId?: string;
  defaultValues?: Partial<FormValues>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      type: "PERSON",
      country: "Slovensko",
      vatPayer: false,
      ...defaultValues,
    },
  });

  const type = watch("type");
  const isBusiness = type === "SOLE_TRADER" || type === "COMPANY";

  async function onSubmit(values: FormValues) {
    const res = customerId
      ? await updateCustomer(customerId, values)
      : await createCustomer(values);
    if (res.ok) {
      toast(customerId ? "Zákazník upravený." : "Zákazník vytvorený.", "success");
      router.push(`/zakaznici/${res.data.id}`);
      router.refresh();
    } else {
      if (res.fieldErrors) {
        Object.entries(res.fieldErrors).forEach(([k, v]) => {
          if (v?.[0]) setError(k as keyof FormValues, { message: v[0] });
        });
      }
      toast(res.error, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Typ zákazníka
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <input type="radio" value={k} {...register("type")} />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {isBusiness ? "Firemné údaje" : "Osobné údaje"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isBusiness ? (
            <>
              <Field label="Meno" error={errors.firstName?.message}>
                <input className="input" {...register("firstName")} />
              </Field>
              <Field label="Priezvisko" error={errors.lastName?.message}>
                <input className="input" {...register("lastName")} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Obchodný názov" error={errors.businessName?.message}>
                <input className="input" {...register("businessName")} />
              </Field>
              <Field label="Kontaktná osoba" error={errors.contactPerson?.message}>
                <input className="input" {...register("contactPerson")} />
              </Field>
              <Field label="IČO" error={errors.ico?.message}>
                <input className="input" {...register("ico")} />
              </Field>
              <Field label="DIČ" error={errors.dic?.message}>
                <input className="input" {...register("dic")} />
              </Field>
              <Field label="IČ DPH" error={errors.icDph?.message}>
                <input className="input" {...register("icDph")} />
              </Field>
              <label className="flex items-center gap-2 pt-7 text-sm text-slate-600">
                <input type="checkbox" {...register("vatPayer")} /> Platca DPH
              </label>
            </>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Kontakt a adresa
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="E-mail" error={errors.email?.message}>
            <input type="email" className="input" {...register("email")} />
          </Field>
          <Field label="Telefón" error={errors.phone?.message}>
            <input className="input" {...register("phone")} />
          </Field>
          <Field label="Sekundárny telefón" error={errors.phoneSecondary?.message}>
            <input className="input" {...register("phoneSecondary")} />
          </Field>
          <div />
          <Field label={isBusiness ? "Sídlo – ulica a číslo" : "Trvalá adresa – ulica a číslo"} error={errors.street?.message}>
            <input className="input" {...register("street")} />
          </Field>
          <Field label="Mesto" error={errors.city?.message}>
            <input className="input" {...register("city")} />
          </Field>
          <Field label="PSČ" error={errors.postalCode?.message}>
            <input className="input" {...register("postalCode")} />
          </Field>
          <Field label="Krajina" error={errors.country?.message}>
            <input className="input" {...register("country")} />
          </Field>
        </div>
      </div>

      <div className="card p-6">
        <Field label="Interná poznámka" error={errors.internalNote?.message}>
          <textarea rows={3} className="input" {...register("internalNote")} />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          Zrušiť
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Ukladám…" : customerId ? "Uložiť zmeny" : "Vytvoriť zákazníka"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
