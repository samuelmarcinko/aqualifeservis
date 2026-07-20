import { PrismaClient } from "../src/generated/prisma";
import { auth } from "../src/lib/auth";
import {
  COMPANY_DEFAULTS,
  DEFAULT_PROTOCOL_EMAIL_BODY,
  DEFAULT_QUOTATION_EMAIL_BODY,
} from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  // 1. Company settings
  await prisma.companySettings.upsert({
    where: { id: "company" },
    update: {},
    create: {
      id: "company",
      name: COMPANY_DEFAULTS.name,
      street: COMPANY_DEFAULTS.street,
      city: COMPANY_DEFAULTS.city,
      postalCode: COMPANY_DEFAULTS.postalCode,
      country: COMPANY_DEFAULTS.country,
      ico: COMPANY_DEFAULTS.ico,
      dic: COMPANY_DEFAULTS.dic,
      icDph: COMPANY_DEFAULTS.icDph,
      vatPayer: COMPANY_DEFAULTS.vatPayer,
      vatPayerSince: COMPANY_DEFAULTS.vatPayerSince,
      email: COMPANY_DEFAULTS.email,
      phone: COMPANY_DEFAULTS.phone,
      website: COMPANY_DEFAULTS.website,
      brandLight: COMPANY_DEFAULTS.brandLight,
      brandDark: COMPANY_DEFAULTS.brandDark,
      defaultVatRate: COMPANY_DEFAULTS.defaultVatRate,
      quotationValidityDays: COMPANY_DEFAULTS.quotationValidityDays,
      quotationEmailBody: DEFAULT_QUOTATION_EMAIL_BODY,
      protocolEmailBody: DEFAULT_PROTOCOL_EMAIL_BODY,
    },
  });
  console.log("✔ Firemné nastavenia pripravené.");

  // 2. SMTP settings row
  await prisma.smtpSettings.upsert({
    where: { id: "smtp" },
    update: {},
    create: { id: "smtp" },
  });
  console.log("✔ SMTP nastavenia pripravené.");

  // 3. Initial SUPER_ADMIN
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD;
  const name = process.env.INITIAL_SUPER_ADMIN_NAME || "Super Administrátor";

  if (!email || !password) {
    console.warn(
      "⚠ INITIAL_SUPER_ADMIN_EMAIL / INITIAL_SUPER_ADMIN_PASSWORD nie sú nastavené — preskakujem vytvorenie super administrátora.",
    );
  } else {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`✔ Super administrátor už existuje: ${email}`);
    } else {
      const ctx = await auth.$context;
      const hash = await ctx.password.hash(password);
      await prisma.user.create({
        data: {
          name,
          email,
          emailVerified: true,
          role: "SUPER_ADMIN",
          active: true,
          accounts: {
            create: { providerId: "credential", accountId: email, password: hash },
          },
        },
      });
      console.log(`✔ Vytvorený super administrátor: ${email}`);
    }
  }

  // 4. A few starter catalog items
  const starters = [
    { name: "Servisný výjazd", type: "SERVICE" as const, defaultUnit: "km", defaultPrice: 0.5 },
    { name: "Práca technika", type: "SERVICE" as const, defaultUnit: "hod.", defaultPrice: 35 },
    { name: "Diagnostika poruchy", type: "SERVICE" as const, defaultUnit: "ks", defaultPrice: 45 },
    { name: "Tesnenie", type: "MATERIAL" as const, defaultUnit: "ks", defaultPrice: 3.5 },
  ];
  for (const s of starters) {
    const exists = await prisma.catalogItem.findFirst({ where: { name: s.name } });
    if (!exists) {
      await prisma.catalogItem.create({ data: { ...s, defaultVatRate: 23 } });
    }
  }
  console.log("✔ Ukážkové položky katalógu pripravené.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
