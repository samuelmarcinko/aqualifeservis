import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { PageHeader } from "@/components/ui/page";
import { UsersManager } from "./users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const current = await requireSuperAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader title="Používatelia" subtitle="Správa administrátorských účtov" />
      <UsersManager
        currentUserId={current.id}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
