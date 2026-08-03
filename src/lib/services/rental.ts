import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import type { RentalReservation, RentalDelivery } from "@/generated/prisma";
import { allocateDocumentNumber } from "./numbering";
import { getRentalSettings, getCompanySettings } from "./settings";
import { sendMail } from "./email";
import { wrapEmailHtml, renderTemplate } from "./email-templates";
import { logActivity } from "./activity";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  computeRentalPrice,
  isRangeAvailable,
  fullyBookedDays,
  rentalDays,
  toDayISO,
  dayToDate,
  type BookingRange,
} from "./rental-core";

async function getBookingRanges(
  toolId: string,
  fromISO: string,
  toISO: string,
  excludeReservationId?: string,
): Promise<BookingRange[]> {
  const rows = await prisma.rentalBooking.findMany({
    where: {
      toolId,
      startDate: { lte: dayToDate(toISO) },
      endDate: { gte: dayToDate(fromISO) },
      ...(excludeReservationId ? { reservationId: { not: excludeReservationId } } : {}),
    },
  });
  return rows.map((b) => ({
    startISO: toDayISO(b.startDate),
    endISO: toDayISO(b.endDate),
    units: b.units,
  }));
}

/** Fully-booked days for a tool within a window (for the public calendar). */
export async function getUnavailableDays(
  toolId: string,
  fromISO: string,
  toISO: string,
): Promise<string[]> {
  const tool = await prisma.rentalTool.findUnique({
    where: { id: toolId },
    select: { quantity: true },
  });
  if (!tool) return [];
  const ranges = await getBookingRanges(toolId, fromISO, toISO);
  return fullyBookedDays(tool.quantity, ranges, fromISO, toISO);
}

export interface CreateReservationInput {
  toolId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  customerNote?: string;
  deliveryType: RentalDelivery;
  deliveryKm?: number | null;
  deliveryAddress?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<RentalReservation> {
  const tool = await prisma.rentalTool.findUnique({ where: { id: input.toolId } });
  if (!tool || !tool.active) throw new Error("Náradie nie je dostupné.");
  const settings = await getRentalSettings();

  const startISO = input.startDate;
  const endISO = input.endDate;
  if (endISO < startISO) throw new Error("Dátum konca nemôže byť pred dátumom začiatku.");
  const today = toDayISO(new Date());
  if (startISO < today) throw new Error("Nie je možné rezervovať minulý termín.");

  const days = rentalDays(startISO, endISO);
  if (days < settings.minRentalDays)
    throw new Error(`Minimálna doba prenájmu je ${settings.minRentalDays} dní.`);

  const delivery = input.deliveryType === "DELIVERY";
  const deliveryKm = delivery ? Math.max(0, input.deliveryKm ?? 0) : null;
  if (deliveryKm != null && deliveryKm > settings.maxDeliveryKm)
    throw new Error(`Maximálna vzdialenosť dovozu je ${settings.maxDeliveryKm} km.`);
  if (delivery && !input.deliveryAddress?.trim())
    throw new Error("Pri dovoze zadajte adresu.");

  const ranges = await getBookingRanges(tool.id, startISO, endISO);
  if (!isRangeAvailable(tool.quantity, ranges, startISO, endISO, 1))
    throw new Error("Vybraný termín už nie je voľný. Zvoľte prosím iný.");

  const price = computeRentalPrice({
    dailyPriceExVat: tool.dailyPriceExVat,
    days,
    deliveryKm,
    pricePerKm: settings.deliveryPricePerKm,
    vatRate: tool.vatRate,
  });

  const snapshot = {
    name: tool.name,
    dailyPriceExVat: tool.dailyPriceExVat.toString(),
    vatRate: tool.vatRate.toString(),
  };

  const reservation = await prisma.$transaction(async (tx) => {
    const alloc = await allocateDocumentNumber(tx, "RENTAL", "REZ");
    return tx.rentalReservation.create({
      data: {
        number: alloc.number,
        year: alloc.year,
        seq: alloc.seq,
        toolId: tool.id,
        toolSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerCompany: input.customerCompany,
        customerNote: input.customerNote,
        deliveryType: input.deliveryType,
        deliveryKm,
        deliveryAddress: delivery ? input.deliveryAddress : null,
        startDate: dayToDate(startISO),
        endDate: dayToDate(endISO),
        days,
        rentalExVat: price.rentalExVat,
        deliveryExVat: price.deliveryExVat,
        vatAmount: price.vat,
        priceInclVat: price.inclVat,
        status: "PENDING",
      },
    });
  });

  await logActivity({
    type: "RENTAL_RESERVATION_CREATED",
    description: `Nová rezervácia ${reservation.number} – ${tool.name}`,
  });

  await sendReservationEmail(reservation, tool.name, "customer_received");
  await notifyOwner(reservation, tool.name);

  return reservation;
}

export async function approveReservation(id: string, userId: string) {
  const r = await prisma.rentalReservation.findUniqueOrThrow({
    where: { id },
    include: { tool: true, booking: true },
  });
  if (r.status === "APPROVED") return r;

  const startISO = toDayISO(r.startDate);
  const endISO = toDayISO(r.endDate);
  const ranges = await getBookingRanges(r.toolId, startISO, endISO, r.id);
  if (!isRangeAvailable(r.tool.quantity, ranges, startISO, endISO, 1))
    throw new Error("Termín je už obsadený – rezerváciu nie je možné schváliť.");

  await prisma.$transaction(async (tx) => {
    if (!r.booking) {
      await tx.rentalBooking.create({
        data: {
          toolId: r.toolId,
          startDate: r.startDate,
          endDate: r.endDate,
          units: 1,
          type: "RESERVATION",
          reservationId: r.id,
          createdById: userId,
        },
      });
    }
    await tx.rentalReservation.update({
      where: { id },
      data: { status: "APPROVED", decidedById: userId, decidedAt: new Date() },
    });
  });

  await logActivity({
    type: "RENTAL_RESERVATION_APPROVED",
    description: `Schválená rezervácia ${r.number}`,
    actorId: userId,
  });
  await sendReservationEmail(r, r.tool.name, "approved");
}

export async function rejectReservation(id: string, userId: string, note?: string) {
  const r = await prisma.rentalReservation.findUniqueOrThrow({
    where: { id },
    include: { tool: true },
  });
  await prisma.$transaction(async (tx) => {
    await tx.rentalBooking.deleteMany({ where: { reservationId: id } });
    await tx.rentalReservation.update({
      where: { id },
      data: { status: "REJECTED", adminNote: note, decidedById: userId, decidedAt: new Date() },
    });
  });
  await logActivity({
    type: "RENTAL_RESERVATION_REJECTED",
    description: `Zamietnutá rezervácia ${r.number}`,
    actorId: userId,
  });
  await sendReservationEmail(r, r.tool.name, "rejected");
}

export async function cancelReservation(id: string, userId: string) {
  const r = await prisma.rentalReservation.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction(async (tx) => {
    await tx.rentalBooking.deleteMany({ where: { reservationId: id } });
    await tx.rentalReservation.update({
      where: { id },
      data: { status: "CANCELLED", decidedById: userId, decidedAt: new Date() },
    });
  });
  await logActivity({
    type: "RENTAL_RESERVATION_CANCELLED",
    description: `Zrušená rezervácia ${r.number}`,
    actorId: userId,
  });
}

export async function deleteReservation(id: string) {
  await prisma.rentalReservation.delete({ where: { id } }); // cascade removes booking
}

// --- Manual availability blocks -------------------------------------------

export async function createBlock(input: {
  toolId: string;
  startDate: string;
  endDate: string;
  units?: number;
  note?: string;
  userId: string;
}) {
  const tool = await prisma.rentalTool.findUniqueOrThrow({ where: { id: input.toolId } });
  if (input.endDate < input.startDate) throw new Error("Neplatný termín.");
  await prisma.rentalBooking.create({
    data: {
      toolId: input.toolId,
      startDate: dayToDate(input.startDate),
      endDate: dayToDate(input.endDate),
      units: Math.min(input.units ?? tool.quantity, tool.quantity),
      type: "BLOCK",
      note: input.note,
      createdById: input.userId,
    },
  });
}

export async function deleteBooking(id: string) {
  await prisma.rentalBooking.delete({ where: { id } });
}

// --- Emails ----------------------------------------------------------------

type ReservationEmailKind = "customer_received" | "approved" | "rejected";

async function sendReservationEmail(
  r: RentalReservation,
  toolName: string,
  kind: ReservationEmailKind,
) {
  try {
    const [company, settings] = await Promise.all([getCompanySettings(), getRentalSettings()]);
    const vars = {
      number: r.number,
      toolName,
      startDate: formatDate(r.startDate),
      endDate: formatDate(r.endDate),
      price: formatCurrency(r.priceInclVat),
    };
    const subjectTpl =
      kind === "approved"
        ? settings.approvedEmailSubject
        : kind === "rejected"
          ? settings.rejectedEmailSubject
          : settings.customerEmailSubject;
    const bodyTpl =
      kind === "approved"
        ? settings.approvedEmailBody
        : kind === "rejected"
          ? settings.rejectedEmailBody
          : settings.customerEmailBody;
    const heading =
      kind === "approved"
        ? "Rezervácia schválená"
        : kind === "rejected"
          ? "Rezervácia"
          : "Prijali sme vašu rezerváciu";
    await sendMail({
      to: r.customerEmail,
      subject: renderTemplate(subjectTpl, vars),
      html: wrapEmailHtml(company, renderTemplate(bodyTpl, vars), heading),
      text: renderTemplate(bodyTpl, vars),
    });
  } catch {
    // Best-effort: don't fail the operation because email delivery failed.
  }
}

async function notifyOwner(r: RentalReservation, toolName: string) {
  try {
    const [company, settings] = await Promise.all([getCompanySettings(), getRentalSettings()]);
    const to = settings.ownerNotifyEmail?.trim() || company.email;
    const body = `Nová rezervácia z požičovne.

Číslo: ${r.number}
Náradie: ${toolName}
Termín: ${formatDate(r.startDate)} – ${formatDate(r.endDate)} (${r.days} dní)
Zákazník: ${r.customerName}, ${r.customerEmail}, ${r.customerPhone}
Cena s DPH: ${formatCurrency(r.priceInclVat)}

Rezerváciu schválite alebo zamietnete v portáli v sekcii Požičovňa.`;
    await sendMail({
      to,
      subject: `Nová rezervácia ${r.number} – ${toolName}`,
      html: wrapEmailHtml(company, body, "Nová rezervácia požičovne"),
      text: body,
    });
  } catch {
    /* best-effort */
  }
}
