import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import type { CaseStatus } from "@prisma/client";

export async function getDashboardStats(tenantId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    casesToday,
    pendingQc,
    overdue,
    revenueAgg,
    casesByStatus,
    recentActivity,
  ] = await Promise.all([
    prisma.case.count({
      where: {
        tenantId,
        receivedAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.case.count({
      where: { tenantId, status: "QC_HOLD" },
    }),
    prisma.case.count({
      where: {
        tenantId,
        dueDate: { lt: now },
        status: { notIn: ["DELIVERED", "INVOICED"] },
      },
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId,
        status: "PAID",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
    }),
    prisma.case.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const pipeline = (casesByStatus as { status: CaseStatus; _count: { id: number } }[]).reduce(
    (acc, row) => {
      acc[row.status] = row._count.id;
      return acc;
    },
    {} as Record<CaseStatus, number>
  );

  const statuses: CaseStatus[] = [
    "RECEIVED",
    "IN_PROGRESS",
    "QC_HOLD",
    "READY",
    "DELIVERED",
    "INVOICED",
  ];

  for (const s of statuses) {
    if (!pipeline[s]) pipeline[s] = 0;
  }

  return {
    casesToday,
    pendingQc,
    overdue,
    revenueMonth: Number(revenueAgg._sum.total ?? 0),
    pipeline,
    recentActivity,
  };
}
