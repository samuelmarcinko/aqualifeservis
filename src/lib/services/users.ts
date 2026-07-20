import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma";

/**
 * Account management. Password hashing goes through BetterAuth's own hasher so
 * credentials created here are compatible with the login flow.
 */

async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context;
  return ctx.password.hash(password);
}

export async function createUserAccount(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Používateľ s týmto e-mailom už existuje.");

  const hash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      emailVerified: true,
      role: input.role,
      active: true,
      accounts: {
        create: {
          providerId: "credential",
          accountId: email,
          password: hash,
        },
      },
    },
  });
  return { id: user.id };
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: hash } });
  } else {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await prisma.account.create({
      data: { userId, providerId: "credential", accountId: user.email, password: hash },
    });
  }
  // Invalidate active sessions after a password change.
  await prisma.session.deleteMany({ where: { userId } });
}
