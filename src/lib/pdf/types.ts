export interface PdfCompany {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  ico: string;
  dic: string;
  icDph: string | null;
  vatPayer: boolean;
  email: string;
  phone: string;
  website: string | null;
  logoUrl: string | null;
  stampUrl: string | null;
  brandLight: string;
  brandDark: string;
}

export interface PdfCustomer {
  typeLabel: string;
  displayName: string;
  contactPerson: string | null;
  ico: string | null;
  dic: string | null;
  icDph: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
}

export interface PdfAddress {
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  objectType: string | null;
  apartment: string | null;
}

export interface QuotationPdfItem {
  position: number;
  description: string;
  detail: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountPct: string;
  vatRate: string;
  lineNet: string;
}

export interface PdfVatRow {
  rate: string;
  base: string;
  vat: string;
}

export interface QuotationPdfData {
  company: PdfCompany;
  number: string;
  revision: number;
  issueDate: string;
  validUntil: string;
  taxMode: "STANDARD" | "REVERSE_CHARGE" | "NO_VAT";
  noVatNote: string | null;
  customer: PdfCustomer;
  serviceAddress: PdfAddress | null;
  items: QuotationPdfItem[];
  subtotal: string;
  discountTotal: string;
  taxBase: string;
  vatBreakdown: PdfVatRow[];
  vatTotal: string;
  grandTotal: string;
  customerNote: string | null;
}

export interface ProtocolPdfPhoto {
  url: string;
  caption: string | null;
  categoryLabel: string;
}

export interface ProtocolPdfWorkItem {
  position: number;
  description: string;
  quantity: string | null;
  unit: string | null;
}

export interface ProtocolPdfData {
  company: PdfCompany;
  number: string;
  revision: number;
  /** Set when finalized → renders the supplier's electronic signature + stamp. */
  signedAt: string | null;
  insuranceEventNumber: string | null;
  documentDate: string;
  faultDate: string | null;
  repairDate: string | null;
  customer: PdfCustomer;
  serviceAddress: PdfAddress | null;
  objectStreet: string | null;
  objectCity: string | null;
  objectPostalCode: string | null;
  objectType: string | null;
  objectApartment: string | null;
  insuranceContractNumber: string | null;
  insurer: string | null;
  objectNote: string | null;
  faultType: string | null;
  faultCause: string | null;
  faultDescription: string | null;
  damageExtent: string | null;
  workItems: ProtocolPdfWorkItem[];
  technicianStatement: string | null;
  notes: string | null;
  recommendations: string | null;
  photos: ProtocolPdfPhoto[];
}
