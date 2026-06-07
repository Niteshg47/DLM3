import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  tenantId: string;
  userId: string;
  type: string;
  message: string;
}) {
  return prisma.notification.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      type: params.type,
      message: params.message,
    },
  });
}

/** Notify all lab staff + admin in tenant */
export async function notifyLabTeam(params: {
  tenantId: string;
  type: string;
  message: string;
  excludeUserId?: string;
}) {
  const users = await prisma.user.findMany({
    where: {
      tenantId: params.tenantId,
      active: true,
      role: { in: ["ADMIN", "LAB_STAFF"] },
      ...(params.excludeUserId ? { id: { not: params.excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      tenantId: params.tenantId,
      userId: u.id,
      type: params.type,
      message: params.message,
    })),
  });
}

export async function notifyDoctorUser(params: {
  tenantId: string;
  doctorId: string;
  type: string;
  message: string;
}) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.doctorId },
    select: { userId: true },
  });
  if (!doctor) return;

  await createNotification({
    tenantId: params.tenantId,
    userId: doctor.userId,
    type: params.type,
    message: params.message,
  });
}
