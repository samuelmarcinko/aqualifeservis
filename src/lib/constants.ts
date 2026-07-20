export const APP_NAME = "AQUALIFE SERVIS – Evidencia";

export const DEFAULT_UNITS = [
  "ks",
  "hod.",
  "m",
  "m²",
  "m³",
  "km",
  "deň",
  "súbor",
  "paušál",
] as const;

export const VAT_RATES = [23, 19, 5, 0] as const;

export const DEFAULT_QUOTATION_EMAIL_BODY = `Dobrý deň,

v prílohe Vám zasielame cenovú ponuku č. {{documentNumber}}.

Cenová ponuka je platná do {{validUntil}}.

V prípade otázok nás môžete kontaktovať odpoveďou na tento e-mail alebo telefonicky na čísle 0902 371 298.

S pozdravom
AQUALIFE SERVIS s. r. o.`;

export const DEFAULT_PROTOCOL_EMAIL_BODY = `Dobrý deň,

v prílohe Vám zasielame protokol o oprave č. {{documentNumber}}.

V prípade otázok nás môžete kontaktovať odpoveďou na tento e-mail alebo telefonicky na čísle 0902 371 298.

S pozdravom
AQUALIFE SERVIS s. r. o.`;

export const COMPANY_DEFAULTS = {
  name: "AQUALIFE SERVIS s. r. o.",
  street: "Malinová 347/24",
  city: "Teriakovce",
  postalCode: "080 05",
  country: "Slovensko",
  ico: "54614210",
  dic: "2121746132",
  icDph: "SK2121746132",
  vatPayer: true,
  vatPayerSince: new Date("2026-07-05"),
  email: "info@aqualife.sk",
  phone: "0902 371 298",
  website: "www.aqualife.sk",
  brandLight: "#2FA0E4",
  brandDark: "#114EA9",
  defaultVatRate: 23,
  quotationValidityDays: 30,
} as const;

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  PERSON: "Fyzická osoba",
  SOLE_TRADER: "Živnostník",
  COMPANY: "Firma",
};

export const QUOTATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Koncept",
  READY: "Pripravená",
  SENT: "Odoslaná",
  ACCEPTED: "Prijatá",
  REJECTED: "Zamietnutá",
  EXPIRED: "Expirovaná",
  CANCELLED: "Zrušená",
  ARCHIVED: "Archivovaná",
};

export const PROTOCOL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Koncept",
  FINAL: "Finalizovaný",
  SENT: "Odoslaný",
  ARCHIVED: "Archivovaný",
};

export const TAX_MODE_LABELS: Record<string, string> = {
  STANDARD: "Štandardný režim DPH",
  REVERSE_CHARGE: "Prenesenie daňovej povinnosti",
  NO_VAT: "Bez DPH",
};

export const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  BEFORE: "Pred opravou",
  AFTER: "Po oprave",
  OTHER: "Ostatné",
};

export const CATALOG_TYPE_LABELS: Record<string, string> = {
  SERVICE: "Služba",
  MATERIAL: "Materiál",
};

export const MAX_PHOTOS_PER_PROTOCOL = 20;
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
