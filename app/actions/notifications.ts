"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id, tenantId: session.user.tenantId },
    data: { read: true },
  });

  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/", "layout");
}
