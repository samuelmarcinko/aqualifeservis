import { z } from "zod";

const optionalStr = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v == null || v === "" ? undefined : v));

const optionalLongStr = z
  .string()
  .trim()
  .max(10000)
  .nullish()
  .transform((v) => (v == null || v === "" ? undefined : v));

/** Build a readable Slovak message from a ZodError (unique messages, first few). */
export function zodErrorMessage(err: z.ZodError): string {
  const msgs = [...new Set(err.issues.map((i) => i.message))]
    .filter((m) => m && m !== "Required")
    .slice(0, 4);
  return msgs.length ? msgs.join(" · ") : "Skontrolujte zadané údaje.";
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export const customerSchema = z
  .object({
    type: z.enum(["PERSON", "SOLE_TRADER", "COMPANY"]),
    firstName: optionalStr,
    lastName: optionalStr,
    businessName: optionalStr,
    contactPerson: optionalStr,
    ico: optionalStr,
    dic: optionalStr,
    icDph: optionalStr,
    vatPayer: z.boolean().default(false),
    email: z
      .string()
      .trim()
      .email("Neplatný e-mail.")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v === "" ? undefined : v)),
    phone: optionalStr,
    phoneSecondary: optionalStr,
    street: optionalStr,
    city: optionalStr,
    postalCode: optionalStr,
    country: z.string().trim().min(1).default("Slovensko"),
    internalNote: optionalLongStr,
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERSON") {
      if (!data.firstName)
        ctx.addIssue({ code: "custom", path: ["firstName"], message: "Meno je povinné." });
      if (!data.lastName)
        ctx.addIssue({ code: "custom", path: ["lastName"], message: "Priezvisko je povinné." });
    } else {
      if (!data.businessName)
        ctx.addIssue({
          code: "custom",
          path: ["businessName"],
          message: "Obchodný názov je povinný.",
        });
    }
  });

export type CustomerInput = z.infer<typeof customerSchema>;

export const serviceAddressSchema = z.object({
  label: z.string().trim().min(1, "Označenie je povinné.").max(200),
  street: optionalStr,
  city: optionalStr,
  postalCode: optionalStr,
  country: z.string().trim().min(1).default("Slovensko"),
  objectType: optionalStr,
  apartment: optionalStr,
  note: optionalLongStr,
  isDefault: z.boolean().default(false),
});
export type ServiceAddressInput = z.infer<typeof serviceAddressSchema>;

export const customerNoteSchema = z.object({
  body: z.string().trim().min(1, "Poznámka nemôže byť prázdna.").max(5000),
});

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const catalogItemSchema = z.object({
  name: z.string().trim().min(1, "Názov je povinný.").max(300),
  type: z.enum(["SERVICE", "MATERIAL"]),
  description: optionalLongStr,
  defaultUnit: z.string().trim().min(1).max(20).default("ks"),
  defaultPrice: z.coerce.number().min(0, "Cena nemôže byť záporná.").default(0),
  defaultVatRate: z.coerce.number().min(0).max(100).default(23),
});
export type CatalogItemInput = z.infer<typeof catalogItemSchema>;

// ---------------------------------------------------------------------------
// Quotation
// ---------------------------------------------------------------------------

export const quotationItemSchema = z.object({
  description: z.string().trim().min(1, "Popis položky je povinný.").max(500),
  detail: optionalLongStr,
  quantity: z.coerce.number().min(0, "Množstvo nemôže byť záporné."),
  unit: z.string().trim().min(1).max(20).default("ks"),
  unitPrice: z.coerce.number().min(0, "Cena nemôže byť záporná."),
  discountPct: z.coerce.number().min(0).max(100).default(0),
  vatRate: z.coerce.number().min(0).max(100).default(23),
  catalogItemId: z.string().optional(),
});

export const quotationSchema = z.object({
  customerId: z.string().min(1, "Zákazník je povinný."),
  serviceAddressId: z.string().optional().nullable(),
  issueDate: z.coerce.date(),
  validUntil: z.coerce.date(),
  taxMode: z.enum(["STANDARD", "REVERSE_CHARGE", "NO_VAT"]).default("STANDARD"),
  noVatNote: optionalLongStr,
  documentDiscountType: z.enum(["NONE", "PERCENT", "FIXED"]).default("NONE"),
  documentDiscountValue: z.coerce.number().min(0).default(0),
  internalNote: optionalLongStr,
  customerNote: optionalLongStr,
  items: z.array(quotationItemSchema).min(1, "Pridajte aspoň jednu položku."),
});
export type QuotationInput = z.infer<typeof quotationSchema>;

// ---------------------------------------------------------------------------
// Repair protocol
// ---------------------------------------------------------------------------

export const protocolWorkItemSchema = z.object({
  description: z.string().trim().min(1, "Popis je povinný.").max(500),
  quantity: z.coerce.number().min(0).optional().nullable(),
  unit: optionalStr,
  internalNote: optionalStr,
  catalogItemId: z.string().optional(),
});

export const protocolSchema = z.object({
  customerId: z.string().min(1, "Zákazník je povinný."),
  serviceAddressId: z.string().optional().nullable(),
  insuranceEventNumber: optionalStr,
  documentDate: z.coerce.date(),
  faultDate: z.coerce.date().optional().nullable(),
  repairDate: z.coerce.date().optional().nullable(),
  objectStreet: optionalStr,
  objectCity: optionalStr,
  objectPostalCode: optionalStr,
  objectType: optionalStr,
  objectApartment: optionalStr,
  insuranceContractNumber: optionalStr,
  insurer: optionalStr,
  objectNote: optionalLongStr,
  faultType: optionalStr,
  faultCause: optionalLongStr,
  faultDescription: optionalLongStr,
  damageExtent: optionalLongStr,
  technicianStatement: optionalLongStr,
  notes: optionalLongStr,
  recommendations: optionalLongStr,
  workItems: z.array(protocolWorkItemSchema).default([]),
});
export type ProtocolInput = z.infer<typeof protocolSchema>;

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const companySettingsSchema = z.object({
  name: z.string().trim().min(1),
  street: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
  ico: z.string().trim().min(1),
  dic: z.string().trim().min(1),
  icDph: optionalStr,
  vatPayer: z.boolean().default(true),
  vatPayerSince: z.coerce.date().optional().nullable(),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  website: optionalStr,
  brandLight: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Neplatná farba."),
  brandDark: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Neplatná farba."),
  defaultVatRate: z.coerce.number().min(0).max(100),
  quotationValidityDays: z.coerce.number().int().min(1).max(365),
  quotationPrefix: z.string().trim().min(1).max(10),
  protocolPrefix: z.string().trim().min(1).max(10),
  quotationEmailSubject: z.string().trim().min(1).max(300),
  quotationEmailBody: z.string().trim().min(1).max(5000),
  protocolEmailSubject: z.string().trim().min(1).max(300),
  protocolEmailBody: z.string().trim().min(1).max(5000),
});

export const smtpSettingsSchema = z.object({
  host: optionalStr,
  port: z.coerce.number().int().min(1).max(65535).default(587),
  secure: z.boolean().default(false),
  username: optionalStr,
  password: z.string().max(500).optional(),
  senderName: z.string().trim().min(1),
  senderEmail: z.string().trim().email(),
  replyTo: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export const testEmailSchema = z.object({
  recipient: z.string().trim().email("Neplatný e-mail."),
});

// ---------------------------------------------------------------------------
// AI assistant
// ---------------------------------------------------------------------------

export const aiSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  model: z.string().trim().min(1).max(100).default("gemini-flash-latest"),
  apiKey: z.string().max(400).optional(),
  instructions: z.string().max(6000).optional(),
});

export const aiTextSchema = z.object({
  text: z.string().trim().min(3, "Zadajte dlhší text.").max(20000),
});

export const aiAudioSchema = z.object({
  data: z.string().min(10, "Chýba zvukový záznam.").max(28_000_000),
  mimeType: z.string().trim().min(3).max(80),
});

// ---------------------------------------------------------------------------
// Rental (požičovňa)
// ---------------------------------------------------------------------------

export const rentalCategorySchema = z.object({
  name: z.string().trim().min(1, "Názov je povinný.").max(200),
  description: optionalLongStr,
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const rentalToolSchema = z.object({
  categoryId: z.string().min(1, "Kategória je povinná."),
  name: z.string().trim().min(1, "Názov je povinný.").max(200),
  model: optionalStr,
  description: optionalLongStr,
  accessories: optionalLongStr,
  dailyPriceExVat: z.coerce.number().min(0).default(0),
  vatRate: z.coerce.number().min(0).max(100).default(23),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const rentalSettingsSchema = z.object({
  deliveryPricePerKm: z.coerce.number().min(0),
  maxDeliveryKm: z.coerce.number().int().min(0).max(10000),
  minRentalDays: z.coerce.number().int().min(1).max(365),
  publicIntro: optionalLongStr,
  termsText: optionalLongStr,
  contactEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  contactPhone: optionalStr,
  ownerNotifyEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  pickupAddress: optionalStr,
  pickupNote: optionalLongStr,
  pickupMapEmbed: optionalLongStr,
  facebookUrl: z
    .string()
    .trim()
    .url("Neplatný odkaz na Facebook.")
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  instagramUrl: z
    .string()
    .trim()
    .url("Neplatný odkaz na Instagram.")
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  customerEmailSubject: z.string().trim().min(1).max(300),
  customerEmailBody: z.string().trim().min(1).max(5000),
  approvedEmailSubject: z.string().trim().min(1).max(300),
  approvedEmailBody: z.string().trim().min(1).max(5000),
  rejectedEmailSubject: z.string().trim().min(1).max(300),
  rejectedEmailBody: z.string().trim().min(1).max(5000),
});

export const rentalToolVideosSchema = z.object({
  videos: z.array(z.string().trim().url("Neplatný odkaz.").max(500)).max(10),
});

export const rentalAccessoryGroupSchema = z.object({
  name: z.string().trim().min(1, "Názov skupiny je povinný.").max(120),
  required: z.boolean().default(false),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const rentalAccessoryOptionSchema = z.object({
  name: z.string().trim().min(1, "Názov je povinný.").max(160),
  description: optionalLongStr,
  dailyPriceExVat: z.coerce.number().min(0).default(0),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const rentalReservationEditSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Neplatný dátum."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Neplatný dátum."),
  customerName: z.string().trim().min(1, "Meno je povinné.").max(200),
  customerEmail: z.string().trim().email("Neplatný e-mail."),
  customerPhone: z.string().trim().min(1, "Telefón je povinný.").max(40),
  customerCompany: optionalStr,
  customerNote: optionalLongStr,
  deliveryType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryKm: z.coerce.number().int().min(0).max(10000).optional().nullable(),
  deliveryExVat: z.coerce.number().min(0).default(0),
  deliveryAddress: optionalStr,
  adminNote: optionalLongStr,
});

export const rentalBlockSchema = z.object({
  toolId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Neplatný dátum."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Neplatný dátum."),
  note: optionalStr,
});

// Public reservation submission
export const publicReservationSchema = z.object({
  toolId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Zvoľte termín."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Zvoľte termín."),
  customerName: z.string().trim().min(2, "Zadajte meno.").max(200),
  customerEmail: z.string().trim().email("Neplatný e-mail."),
  customerPhone: z.string().trim().min(6, "Zadajte telefón.").max(40),
  customerCompany: optionalStr,
  customerNote: optionalLongStr,
  deliveryType: z.enum(["PICKUP", "DELIVERY"]).default("PICKUP"),
  deliveryKm: z.coerce.number().int().min(0).max(10000).optional(),
  deliveryAddress: optionalStr,
  accessoryOptionIds: z.array(z.string().min(1)).max(30).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Potvrďte súhlas so spracovaním údajov." }) }),
  // Honeypot — must stay empty.
  website: z.string().max(0).optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Meno je povinné.").max(200),
  email: z.string().trim().email("Neplatný e-mail."),
  password: z
    .string()
    .min(10, "Heslo musí mať aspoň 10 znakov.")
    .max(200)
    .regex(/[a-z]/, "Heslo musí obsahovať malé písmeno.")
    .regex(/[A-Z]/, "Heslo musí obsahovať veľké písmeno.")
    .regex(/[0-9]/, "Heslo musí obsahovať číslicu."),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
});

export const setPasswordSchema = z.object({
  password: z
    .string()
    .min(10, "Heslo musí mať aspoň 10 znakov.")
    .max(200)
    .regex(/[a-z]/, "Heslo musí obsahovať malé písmeno.")
    .regex(/[A-Z]/, "Heslo musí obsahovať veľké písmeno.")
    .regex(/[0-9]/, "Heslo musí obsahovať číslicu."),
});

// ---------------------------------------------------------------------------
// Email send
// ---------------------------------------------------------------------------

export const sendDocumentSchema = z.object({
  recipient: z.string().trim().email("Neplatný e-mail príjemcu."),
  subject: z.string().trim().min(1, "Predmet je povinný.").max(300),
  message: z.string().trim().min(1, "Správa je povinná.").max(10000),
  revision: z.coerce.number().int().min(1),
});
