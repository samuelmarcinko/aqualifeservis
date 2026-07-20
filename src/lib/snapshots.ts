import type { Customer, CustomerServiceAddress } from "@/generated/prisma";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";

/**
 * Denormalized snapshots stored on documents so historical records stay valid
 * even if the source customer / address changes later.
 */

export interface CustomerSnapshot {
  type: string;
  typeLabel: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  contactPerson: string | null;
  ico: string | null;
  dic: string | null;
  icDph: string | null;
  vatPayer: boolean;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
}

export interface ServiceAddressSnapshot {
  label: string;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  objectType: string | null;
  apartment: string | null;
  note: string | null;
}

export function customerDisplayName(c: {
  type: string;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
}): string {
  if (c.type === "PERSON") {
    return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez mena";
  }
  return c.businessName || "Bez názvu";
}

export function buildCustomerSnapshot(c: Customer): CustomerSnapshot {
  return {
    type: c.type,
    typeLabel: CUSTOMER_TYPE_LABELS[c.type] ?? c.type,
    displayName: customerDisplayName(c),
    firstName: c.firstName,
    lastName: c.lastName,
    businessName: c.businessName,
    contactPerson: c.contactPerson,
    ico: c.ico,
    dic: c.dic,
    icDph: c.icDph,
    vatPayer: c.vatPayer,
    email: c.email,
    phone: c.phone,
    street: c.street,
    city: c.city,
    postalCode: c.postalCode,
    country: c.country,
  };
}

export function buildServiceAddressSnapshot(
  a: CustomerServiceAddress,
): ServiceAddressSnapshot {
  return {
    label: a.label,
    street: a.street,
    city: a.city,
    postalCode: a.postalCode,
    country: a.country,
    objectType: a.objectType,
    apartment: a.apartment,
    note: a.note,
  };
}
