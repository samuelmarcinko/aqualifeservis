-- Add company stamp/signature image for electronically signed protocols
ALTER TABLE "company_settings" ADD COLUMN "stampUrl" TEXT;
ALTER TABLE "company_settings" ADD COLUMN "stampBlobPath" TEXT;
