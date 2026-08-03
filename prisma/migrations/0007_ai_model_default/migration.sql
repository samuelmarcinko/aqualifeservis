-- Update default AI model (gemini-2.0-flash was retired by Google)
ALTER TABLE "ai_settings" ALTER COLUMN "model" SET DEFAULT 'gemini-2.5-flash';
