-- Optional custom AI guidance appended to the built-in system prompt
ALTER TABLE "ai_settings" ADD COLUMN "instructions" TEXT;
