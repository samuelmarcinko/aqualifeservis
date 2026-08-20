-- Hero image + social links for the rental storefront
ALTER TABLE "rental_settings" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "rental_settings" ADD COLUMN "heroImageBlobPath" TEXT;
ALTER TABLE "rental_settings" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "rental_settings" ADD COLUMN "instagramUrl" TEXT;
