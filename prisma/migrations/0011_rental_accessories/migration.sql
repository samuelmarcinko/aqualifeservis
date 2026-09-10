-- Rental tool accessories: groups (required/optional) with priced options
CREATE TABLE "rental_accessory_group" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rental_accessory_group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rental_accessory_option" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "imageBlobPath" TEXT,
    "dailyPriceExVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rental_accessory_option_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rental_accessory_group_toolId_idx" ON "rental_accessory_group"("toolId");
CREATE INDEX "rental_accessory_option_groupId_idx" ON "rental_accessory_option"("groupId");

ALTER TABLE "rental_accessory_group" ADD CONSTRAINT "rental_accessory_group_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "rental_tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_accessory_option" ADD CONSTRAINT "rental_accessory_option_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "rental_accessory_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Selected accessories snapshot + their price on each reservation
ALTER TABLE "rental_reservation" ADD COLUMN "accessories" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "rental_reservation" ADD COLUMN "accessoriesExVat" DECIMAL(12,2) NOT NULL DEFAULT 0;
