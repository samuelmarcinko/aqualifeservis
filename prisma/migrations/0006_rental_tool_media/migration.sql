-- Tool model name, gallery, manuals and videos
ALTER TABLE "rental_tool" ADD COLUMN "model" TEXT;
ALTER TABLE "rental_tool" ADD COLUMN "galleryPhotos" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "rental_tool" ADD COLUMN "manuals" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "rental_tool" ADD COLUMN "videos" JSONB NOT NULL DEFAULT '[]';
