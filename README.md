# AQUALIFE SERVIS – Evidencia

Interná administračná aplikácia pre **AQUALIFE SERVIS s. r. o.** na správu zákazníkov,
tvorbu cenových ponúk a protokolov o oprave, generovanie brandovaných PDF,
fotodokumentáciu opráv a odosielanie dokumentov e-mailom cez SMTP.

Aplikácia je **len interná** – bez verejnej registrácie, bez zákazníckeho portálu.
Používateľské rozhranie, e-maily aj PDF sú v **slovenčine** (sk-SK, EUR, Europe/Bratislava).

---

## Technológie

| Oblasť | Technológia |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Štýly | Tailwind CSS |
| Databáza | PostgreSQL + Prisma ORM |
| Autentifikácia | BetterAuth (e-mail + heslo, roly) |
| Validácia | Zod + React Hook Form |
| PDF | @react-pdf/renderer (embedovaný font Roboto s plnou diakritikou) |
| E-mail | Nodemailer (SMTP) |
| Úložisko | Vercel Blob (fotky + generované PDF) |
| Testy | Vitest |

---

## Architektúra

```
src/
  app/
    (app)/                  # chránená časť za prihlásením (spoločný shell)
      prehlad/              # dashboard
      zakaznici/            # zákazníci + servisné adresy + história + poznámky
      cenove-ponuky/        # editor, detail, PDF, odoslanie, revízie
      protokoly/            # editor, fotodokumentácia, PDF, revízie
      katalog/              # katalóg položiek (služby/materiál)
      pouzivatelia/         # správa účtov (len SUPER_ADMIN)
      nastavenia/           # firemné údaje, branding, číslovanie, SMTP, šablóny (SUPER_ADMIN)
    api/                    # route handlers: auth, PDF, fotky, vyhľadávanie, našepkávač
    prihlasenie/            # prihlasovacia stránka
  components/               # UI primitívy (modal, toast, badges, shell, editor)
  lib/
    services/               # zdieľaná biznis logika (viď nižšie)
    pdf/                    # PDF šablóny, štýly, font, render
    validation.ts           # Zod schémy
    snapshots.ts            # denormalizované snapshoty dokumentov
prisma/
  schema.prisma            # dátový model
  migrations/              # SQL migrácie
  seed.ts                  # seed (firma, SMTP, prvý SUPER_ADMIN, ukážkový katalóg)
```

### Zdieľané služby (`src/lib/services`)

- **money.ts** – finančné výpočty (Decimal, ROUND_HALF_UP, DPH podľa sadzieb, zľavy, režimy DPH)
- **numbering.ts** – atomické, konkurenčne bezpečné číslovanie dokumentov (reset po roku)
- **quotations.ts / protocols.ts** – CRUD, finalizácia, revízie, odoslanie
- **photos.ts** – nahrávanie/validácia/poradie fotografií
- **email.ts / email-templates.ts** – SMTP odosielanie + brandované HTML šablóny
- **blob.ts** – Vercel Blob úložisko
- **crypto.ts** – AES-256-GCM šifrovanie SMTP hesla
- **activity.ts** – append-only audit log
- **settings.ts / users.ts** – firemné/SMTP nastavenia a účty

---

## Dátový model (Prisma)

`User`, `Session`, `Account`, `Verification` (BetterAuth) · `Customer`,
`CustomerServiceAddress`, `CustomerNote` · `CatalogItem` · `DocumentSequence` ·
`Quotation`, `QuotationItem`, `QuotationRevision` · `RepairProtocol`,
`ProtocolWorkItem`, `ProtocolPhoto`, `RepairProtocolRevision` · `StoredDocument` ·
`EmailLog` · `ActivityLog` · `CompanySettings` · `SmtpSettings`.

Dokumenty ukladajú **snapshot** zákazníka a položiek, takže historické záznamy
zostávajú platné aj po zmene zdrojových údajov. Finalizované dokumenty sú
nemenné; úprava vyžaduje **novú revíziu** (rovnaké číslo, +1 revízia, zachované
staršie PDF).

---

## Lokálny vývoj

```bash
# 1. Inštalácia závislostí
npm install

# 2. Nastavenie premenných prostredia
cp .env.example .env
#    a doplňte DATABASE_URL, BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY, ...

# 3. Databáza – aplikovanie migrácií
npx prisma migrate deploy      # produkcia / existujúca DB
# alebo pre vývoj:
npx prisma migrate dev

# 4. Seed (firma, SMTP riadok, prvý SUPER_ADMIN, ukážkový katalóg)
npm run db:seed

# 5. Vývojový server
npm run dev        # http://localhost:3000
```

### Príkazy kvality

```bash
npm run typecheck   # TypeScript (strict)
npm run lint        # ESLint (next/core-web-vitals)
npm run test        # Vitest (výpočty, číslovanie, šifrovanie, stavy)
npm run build       # produkčný build
```

---

## Nasadenie na Vercel

1. **Databáza** – vytvorte PostgreSQL (napr. [Neon](https://neon.tech)); skopírujte
   pooled `DATABASE_URL`.
2. **Vercel Blob** – v projekte Vercel → *Storage → Blob* vytvorte store a
   skopírujte `BLOB_READ_WRITE_TOKEN`.
3. **Environment variables** – vo Vercel nastavte všetky premenné z `.env.example`
   (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`,
   `BLOB_READ_WRITE_TOKEN`, `APP_ENCRYPTION_KEY`, `INITIAL_SUPER_ADMIN_*`).
   `BETTER_AUTH_URL` a `NEXT_PUBLIC_APP_URL` nastavte na produkčnú doménu.
4. **Migrácie** – build spúšťa `prisma generate`. Migrácie aplikujte príkazom
   `npx prisma migrate deploy` (lokálne proti produkčnej DB, alebo v CI kroku).
5. **Seed** – jednorazovo spustite `npm run db:seed` (vytvorí prvého SUPER_ADMINa).
6. **Deploy** – prepojte repozitár s Vercelom a nasaďte.

### SMTP
Po prihlásení: **Nastavenia → SMTP**. Zadajte server, port, meno, heslo
(ukladá sa šifrované cez `APP_ENCRYPTION_KEY`, browseru sa nikdy nevracia),
odosielateľa `info@aqualife.sk`. Otestujte tlačidlami *Test pripojenia* a
*Odoslať testovací e-mail*.

### Prvé prihlásenie
Prihláste sa e-mailom/heslom z `INITIAL_SUPER_ADMIN_*`. V **Používatelia**
vytvorte druhý účet (ADMIN alebo SUPER_ADMIN).

---

## Požičovňa náradia (pozicovna.aqualife.sk)

Modul **Požičovňa** má dve časti v jednej aplikácii (rozlíšené podľa domény):

- **Admin** (`portal.aqualife.sk` → sekcia *Požičovňa*): rezervácie
  (schvaľovanie/zamietnutie), kategórie a náradie (fotky, ceny, počet kusov),
  kalendár dostupnosti s manuálnym blokovaním termínov, a nastavenia
  (cena dopravy, e-mailové šablóny) pre SUPER_ADMINa.
- **Verejný web** (`pozicovna.aqualife.sk`): katalóg kategórií a náradia,
  moderný kalendár s voľnými/obsadenými dňami, živý prepočet ceny a
  rezervačný formulár (bez prihlásenia). Rezervácia príde do portálu ako
  *Čaká na schválenie*; po schválení sa termín automaticky zablokuje.

Smerovanie podľa hostname rieši `src/middleware.ts` (host `pozicovna.*` sa
prepisuje na interný strom `/najom`). Dostupnosť zohľadňuje počet kusov –
deň je „obsadený" až keď sú obsadené všetky kusy.

### DNS pre pozicovna.aqualife.sk
1. Vo Vercel projekte: **Settings → Domains → Add** → `pozicovna.aqualife.sk`.
2. U registrátora domény pridajte podľa pokynov Vercelu záznam
   **CNAME** `pozicovna` → `cname.vercel-dns.com`.
3. Po overení a vydaní certifikátu je verejná požičovňa dostupná; admin ostáva
   na `portal.aqualife.sk`.

Migrácia `0004_rental` a seed (kategórie + náradie z cenníka AQUALIFE) sa
aplikujú automaticky pri deployi.

## Bezpečnosť

- Serverová autentifikácia a autorizácia v každej stránke, akcii aj route
  handleri (skrytie položky v menu nie je autorizácia).
- Roly `SUPER_ADMIN` a `ADMIN`; ADMIN nemá prístup k SMTP ani systémovým
  nastaveniam.
- SMTP heslo šifrované (AES-256-GCM), maskované, nikdy v odpovediach/logoch.
- PDF a fotky sa doručujú cez autorizované route handlery (streamované), nie
  cez uhádnuteľné verejné URL.
- Serverová validácia typu a veľkosti súborov, bezpečné názvy.
- Zod validácia na serveri aj klientovi; generické chyby pri prihlásení.

## Zálohovanie
- **Databáza**: využite automatické zálohy poskytovateľa (napr. Neon PITR)
  alebo pravidelný `pg_dump`.
- **Blob**: fotky a PDF sú v Vercel Blob; pri potrebe archivujte kópiu.
- Produkčné fotky/PDF **nikdy** neukladajte do Git repozitára.

---

## Poznámky k implementácii / obmedzenia

- Referenčný projekt *NextAdmin* (NextAdminHQ/nextjs-admin-dashboard) slúžil
  len ako inšpirácia pre rozloženie. Jeho kód **nebol prevzatý** – shell,
  navigácia, tabuľky, formuláre a modály sú vybudované nanovo v AQUALIFE
  identite, takže na aplikáciu sa neviažu žiadne licenčné obmedzenia
  referenčného projektu. Jediná externá binárka v repozitári je font Roboto
  (Apache-2.0, komerčne použiteľný), embedovaný ako base64.
- PDF používa **@react-pdf/renderer** s embedovaným fontom **Roboto**
  (Apache-2.0) kvôli plnej slovenskej diakritike a stabilnému serverovému
  renderovaniu na Vercel (žiadny prístup k súborovému systému za behu).
- Konkurenčne bezpečné číslovanie je riešené atomickým
  `INSERT … ON CONFLICT DO UPDATE … RETURNING` nad tabuľkou `DocumentSequence`
  + unikátny index na čísle dokumentu.
