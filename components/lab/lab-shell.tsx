import { prisma } from "@/lib/prisma";
import { LabShellClient } from "@/components/layout/lab-shell-client";
import type { Tenant } from "@prisma/client";

export async function LabShell({
  tenant,
  children,
  userName,
  userId,
  userRole,
}: {
  tenant: Tenant;
  children: React.ReactNode;
  userName: string;
  userId: string;
  userRole: string;
}) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.notification.count({
      where: { userId, tenantId: tenant.id, read: false },
    }),
  ]);

  return (
    <LabShellClient
      tenantName={tenant.name}
      tenantLogo={tenant.logoUrl}
      userName={userName}
      userRole={userRole}
      userId={userId}
      isAdmin={userRole === "ADMIN" || userRole === "SUPER_ADMIN"}
      notifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      }))}
      unreadCount={unreadCount}
    >
      {children}
    </LabShellClient>
  );
}
