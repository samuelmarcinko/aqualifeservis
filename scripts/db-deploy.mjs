// Runs on Vercel during deployment (via the "vercel-build" script) to apply
// Prisma migrations and seed initial data — so no local machine is needed.
//
// - Uses a DIRECT (unpooled) connection for migrations when available, because
//   Prisma migrate needs a session-mode connection (pgBouncer/pooled can fail
//   on advisory locks).
// - Migrations are required (build fails if they fail).
// - Seeding is best-effort and idempotent (skips the admin if it already
//   exists), so it never blocks a deploy.
//
// This file is intentionally NOT part of the local `npm run build` so that
// CI / local builds don't need a reachable database.

import { execSync } from "node:child_process";

const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!directUrl) {
  console.warn("⚠ DATABASE_URL nie je nastavené — preskakujem migrácie aj seed.");
  process.exit(0);
}

const env = { ...process.env, DATABASE_URL: directUrl };

try {
  console.log("▶ prisma migrate deploy …");
  execSync("prisma migrate deploy", { stdio: "inherit", env });
  console.log("✔ Migrácie aplikované.");
} catch {
  console.error("✗ Migrácie zlyhali. Skontrolujte DATABASE_URL (ideálne priame/unpooled pripojenie).");
  process.exit(1);
}

try {
  console.log("▶ seed (firma, SMTP, prvý SUPER_ADMIN, ukážkový katalóg) …");
  execSync("tsx prisma/seed.ts", { stdio: "inherit", env });
} catch {
  console.warn("⚠ Seed zlyhal alebo bol preskočený — pokračujem v builde (nekritické).");
}
