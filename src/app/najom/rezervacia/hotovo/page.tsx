import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReservationDonePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const number = sp.c ?? "";

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-brand-navy">Rezervácia odoslaná</h1>
      {number && (
        <p className="mt-2 text-slate-600">
          Číslo rezervácie: <strong className="text-brand-dark">{number}</strong>
        </p>
      )}
      <p className="mx-auto mt-3 max-w-md text-slate-500">
        Ďakujeme! Vašu rezerváciu sme prijali a čoskoro Vám ju potvrdíme e-mailom. V prípade otázok
        nás môžete kontaktovať telefonicky.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Späť na požičovňu
      </Link>
    </div>
  );
}
