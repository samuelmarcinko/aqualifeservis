-- Pickup location info for the rental storefront
ALTER TABLE "rental_settings" ADD COLUMN "pickupAddress" TEXT;
ALTER TABLE "rental_settings" ADD COLUMN "pickupNote" TEXT;
ALTER TABLE "rental_settings" ADD COLUMN "pickupMapEmbed" TEXT;
ALTER TABLE "rental_settings" ADD COLUMN "pickupPhotos" JSONB NOT NULL DEFAULT '[]';
