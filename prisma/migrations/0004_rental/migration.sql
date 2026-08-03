-- Tool rental (požičovňa)

-- Extend document numbering for rental reservations (REZ-YYYY-0001)
ALTER TYPE "SequenceKind" ADD VALUE IF NOT EXISTS 'RENTAL';

-- Enums
CREATE TYPE "RentalDelivery" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "RentalReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "RentalBookingType" AS ENUM ('RESERVATION', 'BLOCK');

-- rental_category
CREATE TABLE "rental_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "imageBlobPath" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rental_category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rental_category_slug_key" ON "rental_category"("slug");
CREATE INDEX "rental_category_active_idx" ON "rental_category"("active");

-- rental_tool
CREATE TABLE "rental_tool" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "accessories" TEXT,
    "dailyPriceExVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(6,3) NOT NULL DEFAULT 23,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "imageBlobPath" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rental_tool_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rental_tool_slug_key" ON "rental_tool"("slug");
CREATE INDEX "rental_tool_categoryId_idx" ON "rental_tool"("categoryId");
CREATE INDEX "rental_tool_active_idx" ON "rental_tool"("active");

-- rental_reservation
CREATE TABLE "rental_reservation" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "toolId" TEXT NOT NULL,
    "toolSnapshot" JSONB NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerCompany" TEXT,
    "customerNote" TEXT,
    "deliveryType" "RentalDelivery" NOT NULL DEFAULT 'PICKUP',
    "deliveryKm" INTEGER,
    "deliveryAddress" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "rentalExVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deliveryExVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "priceInclVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "RentalReservationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rental_reservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rental_reservation_number_key" ON "rental_reservation"("number");
CREATE INDEX "rental_reservation_status_idx" ON "rental_reservation"("status");
CREATE INDEX "rental_reservation_toolId_idx" ON "rental_reservation"("toolId");
CREATE INDEX "rental_reservation_createdAt_idx" ON "rental_reservation"("createdAt");
CREATE INDEX "rental_reservation_number_idx" ON "rental_reservation"("number");

-- rental_booking
CREATE TABLE "rental_booking" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "type" "RentalBookingType" NOT NULL DEFAULT 'RESERVATION',
    "reservationId" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rental_booking_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rental_booking_reservationId_key" ON "rental_booking"("reservationId");
CREATE INDEX "rental_booking_toolId_idx" ON "rental_booking"("toolId");
CREATE INDEX "rental_booking_startDate_idx" ON "rental_booking"("startDate");

-- rental_settings
CREATE TABLE "rental_settings" (
    "id" TEXT NOT NULL DEFAULT 'rental',
    "deliveryPricePerKm" DECIMAL(12,3) NOT NULL DEFAULT 0.5,
    "maxDeliveryKm" INTEGER NOT NULL DEFAULT 100,
    "minRentalDays" INTEGER NOT NULL DEFAULT 1,
    "publicIntro" TEXT,
    "termsText" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "ownerNotifyEmail" TEXT,
    "customerEmailSubject" TEXT NOT NULL DEFAULT 'Prijali sme vašu rezerváciu č. {{number}} – AQUALIFE požičovňa',
    "customerEmailBody" TEXT NOT NULL DEFAULT '',
    "approvedEmailSubject" TEXT NOT NULL DEFAULT 'Rezervácia č. {{number}} bola schválená – AQUALIFE požičovňa',
    "approvedEmailBody" TEXT NOT NULL DEFAULT '',
    "rejectedEmailSubject" TEXT NOT NULL DEFAULT 'Rezervácia č. {{number}} – AQUALIFE požičovňa',
    "rejectedEmailBody" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rental_settings_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "rental_tool" ADD CONSTRAINT "rental_tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "rental_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rental_reservation" ADD CONSTRAINT "rental_reservation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "rental_tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rental_booking" ADD CONSTRAINT "rental_booking_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "rental_tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_booking" ADD CONSTRAINT "rental_booking_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "rental_reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
