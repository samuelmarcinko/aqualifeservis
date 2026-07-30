-- AI assistant settings (Gemini)
CREATE TABLE "ai_settings" (
    "id" TEXT NOT NULL DEFAULT 'ai',
    "provider" TEXT NOT NULL DEFAULT 'gemini',
    "model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "apiKeyEnc" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);
