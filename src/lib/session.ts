import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

/**
 * Resolve the current authenticated user (server-side). Role and active status
 * are read from the database as the source of truth, not from the token.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return user;
});

/** Require an authenticated, active user or redirect to login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/prihlasenie");
  return user;
}

/** Require SUPER_ADMIN or redirect to the dashboard (server-side gate). */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/prehlad");
  return user;
}

/** For server actions / route handlers: throw instead of redirect. */
export async function assertUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautorizovaný prístup.");
  return user;
}

export async function assertSuperAdmin(): Promise<SessionUser> {
  const user = await assertUser();
  if (user.role !== "SUPER_ADMIN") throw new Error("Nedostatočné oprávnenia.");
  return user;
}
