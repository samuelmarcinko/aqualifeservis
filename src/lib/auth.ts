import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

/**
 * BetterAuth — email & password only. No public registration, no social login.
 * Sign-up is disabled at the API level; accounts are created by SUPER_ADMIN.
 */
export const auth = betterAuth({
  appName: "AQUALIFE SERVIS – Evidencia",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // internal only — no public registration
    minPasswordLength: 10,
    autoSignIn: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "ADMIN", input: false },
      active: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
