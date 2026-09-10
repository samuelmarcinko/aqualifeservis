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
import { Decimal, round2 } from "./money";

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
  accessoryOptionIds?: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string;
}

export interface AccessorySnapshotItem {
  groupName: string;
  optionName: string;
  dailyPriceExVat: string;
}

/**
 * Validate the selected accessory options against the tool's accessory groups
 * and return a snapshot plus the summed daily price. Required groups must have
 * exactly one selected option; optional groups may have any (0+).
 */
async function resolveAccessories(
  toolId: string,
  optionIds: string[] | undefined,
): Promise<{ snapshot: AccessorySnapshotItem[]; dailyExVat: Decimal }> {
  const groups = await prisma.rentalAccessoryGroup.findMany({
    where: { toolId, active: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { options: { where: { active: true }, orderBy: [{ position: "asc" }, { name: "asc" }] } },
  });
  const selected = new Set(optionIds ?? []);
  const snapshot: AccessorySnapshotItem[] = [];
  let daily = new Decimal(0);

  for (const g of groups) {
    const chosen = g.options.filter((o) => selected.has(o.id));
    if (g.required && chosen.length !== 1)
      throw new Error(`Vyberte príslušenstvo v skupine „${g.name}".`);
    // Optional groups allow any number (0+) of selected options.
    for (const o of chosen) {
      snapshot.push({
        groupName: g.name,
        optionName: o.name,
        dailyPriceExVat: o.dailyPriceExVat.toString(),
      });
      daily = daily.plus(new Decimal(o.dailyPriceExVat));
      selected.delete(o.id);
    }
  }
  // Any leftover ids don't belong to this tool's active options → reject.
  if (selected.size > 0) throw new Error("Neplatné príslušenstvo.");
  return { snapshot, dailyExVat: round2(daily) };
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

  const accessories = await resolveAccessories(tool.id, input.accessoryOptionIds);

  const price = computeRentalPrice({
    dailyPriceExVat: tool.dailyPriceExVat,
    days,
    deliveryKm,
    pricePerKm: settings.deliveryPricePerKm,
    vatRate: tool.vatRate,
    accessoriesDailyExVat: accessories.dailyExVat,
  });

  const snapshot = {
    name: tool.name,
    dailyPriceExVat: tool.dailyPriceExVat.toString(),
    vatRate: tool.vatRate.toString(),
    accessoriesDailyExVat: accessories.dailyExVat.toString(),
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
        accessories: accessories.snapshot as unknown as Prisma.InputJsonValue,
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
        accessoriesExVat: price.accessoriesExVat,
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

export interface UpdateReservationInput {
  startDate: string;
  endDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  customerNote?: string;
  deliveryType: RentalDelivery;
  deliveryKm?: number | null;
  deliveryExVat: number;
  deliveryAddress?: string;
  adminNote?: string;
}

/**
 * Admin edit of a reservation. Rental price stays fixed (days × the tool's
 * snapshotted daily rate); the admin controls the delivery price and distance.
 * If the reservation is approved, the linked booking's dates are updated too.
 */
export async function updateReservation(id: string, input: UpdateReservationInput) {
  const r = await prisma.rentalReservation.findUniqueOrThrow({
    where: { id },
    include: { booking: true },
  });
  if (input.endDate < input.startDate) throw new Error("Dátum konca nemôže byť pred začiatkom.");

  const snap = r.toolSnapshot as unknown as {
    dailyPriceExVat?: string;
    vatRate?: string;
    accessoriesDailyExVat?: string;
  };
  const daily = new Decimal(snap.dailyPriceExVat ?? 0);
  const vatRate = new Decimal(snap.vatRate ?? 23);
  const days = rentalDays(input.startDate, input.endDate);
  const rentalExVat = round2(daily.times(days));
  const accessoriesExVat = round2(new Decimal(snap.accessoriesDailyExVat ?? 0).times(days));
  const deliveryExVat = round2(new Decimal(input.deliveryExVat || 0));
  const exVat = round2(rentalExVat.plus(accessoriesExVat).plus(deliveryExVat));
  const vat = round2(exVat.times(vatRate).dividedBy(100));
  const incl = round2(exVat.plus(vat));

  await prisma.$transaction(async (tx) => {
    await tx.rentalReservation.update({
      where: { id },
      data: {
        startDate: dayToDate(input.startDate),
        endDate: dayToDate(input.endDate),
        days,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerCompany: input.customerCompany,
        customerNote: input.customerNote,
        deliveryType: input.deliveryType,
        deliveryKm: input.deliveryType === "DELIVERY" ? (input.deliveryKm ?? null) : null,
        deliveryAddress: input.deliveryType === "DELIVERY" ? input.deliveryAddress : null,
        rentalExVat,
        accessoriesExVat,
        deliveryExVat,
        vatAmount: vat,
        priceInclVat: incl,
        adminNote: input.adminNote,
      },
    });
    if (r.booking) {
      await tx.rentalBooking.update({
        where: { id: r.booking.id },
        data: { startDate: dayToDate(input.startDate), endDate: dayToDate(input.endDate) },
      });
    }
  });
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
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const link = base ? `\n\nOtvoriť v portáli: ${base}/pozicovna?status=PENDING` : "";
    const deliveryLine =
      r.deliveryType === "DELIVERY"
        ? `\nDovoz na adresu: ${r.deliveryAddress ?? "-"}`
        : "\nOsobný odber";
    const accessoryItems =
      (r.accessories as unknown as { groupName: string; optionName: string }[] | null) ?? [];
    const accessoryLine = accessoryItems.length
      ? `\nPríslušenstvo: ${accessoryItems.map((a) => `${a.groupName}: ${a.optionName}`).join(", ")}`
      : "";
    const body = `Nová rezervácia z požičovne.

Číslo: ${r.number}
Náradie: ${toolName}${accessoryLine}
Termín: ${formatDate(r.startDate)} – ${formatDate(r.endDate)} (${r.days} dní)
Zákazník: ${r.customerName}, ${r.customerEmail}, ${r.customerPhone}${deliveryLine}
Cena s DPH: ${formatCurrency(r.priceInclVat)}

Rezerváciu schválite alebo zamietnete v portáli v sekcii Požičovňa.${link}`;
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
