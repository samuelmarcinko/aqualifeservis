-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'SOLE_TRADER', 'COMPANY');

-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('SERVICE', 'MATERIAL');

-- CreateEnum
CREATE TYPE "SequenceKind" AS ENUM ('QUOTATION', 'PROTOCOL');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'READY', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaxMode" AS ENUM ('STANDARD', 'REVERSE_CHARGE', 'NO_VAT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'FINAL', 'SENT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('BEFORE', 'AFTER', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('QUOTATION', 'PROTOCOL');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "businessName" TEXT,
    "contactPerson" TEXT,
    "ico" TEXT,
    "dic" TEXT,
    "icDph" TEXT,
    "vatPayer" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "phone" TEXT,
    "phoneSecondary" TEXT,
    "street" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Slovensko',
    "internalNote" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_service_address" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Slovensko',
    "objectType" TEXT,
    "apartment" TEXT,
    "note" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_service_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_note" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "description" TEXT,
    "defaultUnit" TEXT NOT NULL DEFAULT 'ks',
    "defaultPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "defaultVatRate" DECIMAL(6,3) NOT NULL DEFAULT 23,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequence" (
    "id" TEXT NOT NULL,
    "kind" "SequenceKind" NOT NULL,
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT NOT NULL,
    "customerSnapshot" JSONB NOT NULL,
    "serviceAddressSnapshot" JSONB,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "taxMode" "TaxMode" NOT NULL DEFAULT 'STANDARD',
    "noVatNote" TEXT,
    "documentDiscountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "documentDiscountValue" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "internalNote" TEXT,
    "customerNote" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatBreakdown" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_item" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "detail" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ks',
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discountPct" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(6,3) NOT NULL DEFAULT 23,
    "catalogItemId" TEXT,
    "lineNet" DECIMAL(12,2) NOT NULL,
    "lineVat" DECIMAL(12,2) NOT NULL,
    "lineGross" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quotation_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_revision" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "storedDocumentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_protocol" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "ProtocolStatus" NOT NULL DEFAULT 'DRAFT',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT NOT NULL,
    "customerSnapshot" JSONB NOT NULL,
    "serviceAddressSnapshot" JSONB,
    "insuranceEventNumber" TEXT,
    "documentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faultDate" TIMESTAMP(3),
    "repairDate" TIMESTAMP(3),
    "objectStreet" TEXT,
    "objectCity" TEXT,
    "objectPostalCode" TEXT,
    "objectType" TEXT,
    "objectApartment" TEXT,
    "insuranceContractNumber" TEXT,
    "insurer" TEXT,
    "objectNote" TEXT,
    "faultType" TEXT,
    "faultCause" TEXT,
    "faultDescription" TEXT,
    "damageExtent" TEXT,
    "technicianStatement" TEXT,
    "notes" TEXT,
    "recommendations" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "repair_protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_work_item" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3),
    "unit" TEXT,
    "internalNote" TEXT,
    "catalogItemId" TEXT,

    CONSTRAINT "protocol_work_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_photo" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "category" "PhotoCategory" NOT NULL DEFAULT 'OTHER',
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "includeInPdf" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_protocol_revision" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "storedDocumentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_protocol_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "senderId" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "messageId" TEXT,
    "storedDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customerId" TEXT,
    "documentType" "DocumentType",
    "documentId" TEXT,
    "documentNumber" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL DEFAULT 'company',
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Slovensko',
    "ico" TEXT NOT NULL,
    "dic" TEXT NOT NULL,
    "icDph" TEXT,
    "vatPayer" BOOLEAN NOT NULL DEFAULT true,
    "vatPayerSince" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "logoBlobPath" TEXT,
    "brandLight" TEXT NOT NULL DEFAULT '#2FA0E4',
    "brandDark" TEXT NOT NULL DEFAULT '#114EA9',
    "defaultVatRate" DECIMAL(6,3) NOT NULL DEFAULT 23,
    "quotationValidityDays" INTEGER NOT NULL DEFAULT 30,
    "quotationPrefix" TEXT NOT NULL DEFAULT 'CP',
    "protocolPrefix" TEXT NOT NULL DEFAULT 'PRO',
    "quotationEmailSubject" TEXT NOT NULL DEFAULT 'Cenová ponuka č. {{documentNumber}} – AQUALIFE SERVIS',
    "quotationEmailBody" TEXT NOT NULL DEFAULT '',
    "protocolEmailSubject" TEXT NOT NULL DEFAULT 'Protokol o oprave č. {{documentNumber}} – AQUALIFE SERVIS',
    "protocolEmailBody" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smtp_settings" (
    "id" TEXT NOT NULL DEFAULT 'smtp',
    "host" TEXT,
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "passwordEnc" TEXT,
    "senderName" TEXT NOT NULL DEFAULT 'AQUALIFE SERVIS s. r. o.',
    "senderEmail" TEXT NOT NULL DEFAULT 'info@aqualife.sk',
    "replyTo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smtp_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "customer_type_idx" ON "customer"("type");

-- CreateIndex
CREATE INDEX "customer_email_idx" ON "customer"("email");

-- CreateIndex
CREATE INDEX "customer_phone_idx" ON "customer"("phone");

-- CreateIndex
CREATE INDEX "customer_ico_idx" ON "customer"("ico");

-- CreateIndex
CREATE INDEX "customer_businessName_idx" ON "customer"("businessName");

-- CreateIndex
CREATE INDEX "customer_lastName_idx" ON "customer"("lastName");

-- CreateIndex
CREATE INDEX "customer_archivedAt_idx" ON "customer"("archivedAt");

-- CreateIndex
CREATE INDEX "customer_createdAt_idx" ON "customer"("createdAt");

-- CreateIndex
CREATE INDEX "customer_service_address_customerId_idx" ON "customer_service_address"("customerId");

-- CreateIndex
CREATE INDEX "customer_note_customerId_idx" ON "customer_note"("customerId");

-- CreateIndex
CREATE INDEX "catalog_item_type_idx" ON "catalog_item"("type");

-- CreateIndex
CREATE INDEX "catalog_item_name_idx" ON "catalog_item"("name");

-- CreateIndex
CREATE INDEX "catalog_item_archivedAt_idx" ON "catalog_item"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequence_kind_year_key" ON "document_sequence"("kind", "year");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_number_key" ON "quotation"("number");

-- CreateIndex
CREATE INDEX "quotation_customerId_idx" ON "quotation"("customerId");

-- CreateIndex
CREATE INDEX "quotation_status_idx" ON "quotation"("status");

-- CreateIndex
CREATE INDEX "quotation_year_idx" ON "quotation"("year");

-- CreateIndex
CREATE INDEX "quotation_createdAt_idx" ON "quotation"("createdAt");

-- CreateIndex
CREATE INDEX "quotation_number_idx" ON "quotation"("number");

-- CreateIndex
CREATE INDEX "quotation_item_quotationId_idx" ON "quotation_item"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_revision_quotationId_idx" ON "quotation_revision"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_revision_quotationId_revision_key" ON "quotation_revision"("quotationId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "repair_protocol_number_key" ON "repair_protocol"("number");

-- CreateIndex
CREATE INDEX "repair_protocol_customerId_idx" ON "repair_protocol"("customerId");

-- CreateIndex
CREATE INDEX "repair_protocol_status_idx" ON "repair_protocol"("status");

-- CreateIndex
CREATE INDEX "repair_protocol_year_idx" ON "repair_protocol"("year");

-- CreateIndex
CREATE INDEX "repair_protocol_createdAt_idx" ON "repair_protocol"("createdAt");

-- CreateIndex
CREATE INDEX "repair_protocol_number_idx" ON "repair_protocol"("number");

-- CreateIndex
CREATE INDEX "protocol_work_item_protocolId_idx" ON "protocol_work_item"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_photo_protocolId_idx" ON "protocol_photo"("protocolId");

-- CreateIndex
CREATE INDEX "repair_protocol_revision_protocolId_idx" ON "repair_protocol_revision"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "repair_protocol_revision_protocolId_revision_key" ON "repair_protocol_revision"("protocolId", "revision");

-- CreateIndex
CREATE INDEX "stored_document_documentNumber_idx" ON "stored_document"("documentNumber");

-- CreateIndex
CREATE INDEX "email_log_documentType_documentId_idx" ON "email_log"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "email_log_recipient_idx" ON "email_log"("recipient");

-- CreateIndex
CREATE INDEX "email_log_createdAt_idx" ON "email_log"("createdAt");

-- CreateIndex
CREATE INDEX "activity_log_customerId_idx" ON "activity_log"("customerId");

-- CreateIndex
CREATE INDEX "activity_log_documentType_documentId_idx" ON "activity_log"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "activity_log_actorId_idx" ON "activity_log"("actorId");

-- CreateIndex
CREATE INDEX "activity_log_createdAt_idx" ON "activity_log"("createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_service_address" ADD CONSTRAINT "customer_service_address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_note" ADD CONSTRAINT "customer_note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_item" ADD CONSTRAINT "quotation_item_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_revision" ADD CONSTRAINT "quotation_revision_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_revision" ADD CONSTRAINT "quotation_revision_storedDocumentId_fkey" FOREIGN KEY ("storedDocumentId") REFERENCES "stored_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_protocol" ADD CONSTRAINT "repair_protocol_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_work_item" ADD CONSTRAINT "protocol_work_item_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "repair_protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_photo" ADD CONSTRAINT "protocol_photo_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "repair_protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_protocol_revision" ADD CONSTRAINT "repair_protocol_revision_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "repair_protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_protocol_revision" ADD CONSTRAINT "repair_protocol_revision_storedDocumentId_fkey" FOREIGN KEY ("storedDocumentId") REFERENCES "stored_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_storedDocumentId_fkey" FOREIGN KEY ("storedDocumentId") REFERENCES "stored_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

