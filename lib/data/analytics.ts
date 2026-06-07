import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/invoices";
import { differenceInDays, eachDayOfInterval, format, startOfDay } from "date-fns";
import type { CaseStatus, CaseType } from "@prisma/client";

export type DateRange = { from: Date; to: Date };

export function parseDateRange(
  range: string | undefined,
  customFrom?: string,
  customTo?: string
): DateRange {
  const to = startOfDay(new Date());
  let from = new Date(to);

  if (range === "7d") from.setDate(from.getDate() - 6);
  else if (range === "90d") from.setDate(from.getDate() - 89);
  else if (range === "custom" && customFrom && customTo) {
    return { from: startOfDay(new Date(customFrom)), to: startOfDay(new Date(customTo)) };
  } else from.setDate(from.getDate() - 29);

  return { from: startOfDay(from), to };
}

export async function getAnalyticsSummary(tenantId: string, range: DateRange) {
  const { from, to } = range;

  const cases = await prisma.case.findMany({
    where: {
      tenantId,
      receivedAt: { gte: from, lte: new Date(to.getTime() + 86400000 - 1) },
    },
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      tasks: { select: { status: true, assignedToId: true } },
    },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: "PAID",
      paidAt: { gte: from, lte: new Date(to.getTime() + 86400000 - 1) },
    },
  });

  const doctors = await prisma.doctor.count({ where: { tenantId } });

  const days = eachDayOfInterval({ start: from, end: to });

  const casesByDay = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const count = cases.filter(
      (c) => format(startOfDay(c.receivedAt), "yyyy-MM-dd") === key
    ).length;
    return { date: format(day, "dd MMM"), count };
  });

  const revenueByDay = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const amount = invoices
      .filter((i) => i.paidAt && format(startOfDay(i.paidAt), "yyyy-MM-dd") === key)
      .reduce((s, i) => s + decimalToNumber(i.total), 0);
    return { date: format(day, "dd MMM"), amount };
  });

  const byType: Record<CaseType, number> = {
    CROWN: 0,
    BRIDGE: 0,
    DENTURE: 0,
    IMPLANT: 0,
    ALIGNER: 0,
    OTHER: 0,
  };
  for (const c of cases) byType[c.caseType]++;

  const byStatus: Record<CaseStatus, number> = {
    RECEIVED: 0,
    IN_PROGRESS: 0,
    QC_HOLD: 0,
    READY: 0,
    DELIVERED: 0,
    INVOICED: 0,
  };
  for (const c of cases) byStatus[c.status]++;

  const doctorCounts = new Map<string, { name: string; count: number }>();
  for (const c of cases) {
    const id = c.doctorId;
    const existing = doctorCounts.get(id);
    if (existing) existing.count++;
    else doctorCounts.set(id, { name: c.doctor.user.name, count: 1 });
  }
  const topDoctors = Array.from(doctorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const turnaroundDays = cases
    .filter((c) => c.deliveredAt)
    .map((c) => differenceInDays(c.deliveredAt!, c.receivedAt));
  const avgTurnaround =
    turnaroundDays.length > 0
      ? Math.round(
          (turnaroundDays.reduce((a, b) => a + b, 0) / turnaroundDays.length) * 10
        ) / 10
      : 0;

  const totalRevenue = invoices.reduce((s, i) => s + decimalToNumber(i.total), 0);

  const staffUsers = await prisma.user.findMany({
    where: { tenantId, role: { in: ["LAB_STAFF", "ADMIN"] }, active: true },
    select: { id: true, name: true },
  });

  const staffProductivity = staffUsers.map((user) => {
    const assigned = cases.flatMap((c) =>
      c.tasks.filter((t) => t.assignedToId === user.id)
    );
    const completed = assigned.filter((t) => t.status === "DONE").length;
    const total = assigned.length;
    return {
      name: user.name,
      assigned: total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return {
    summary: {
      totalCases: cases.length,
      totalRevenue,
      avgTurnaround,
      activeDoctors: doctors,
    },
    casesByDay,
    revenueByDay,
    byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
    byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    topDoctors,
    staffProductivity,
    hasData: cases.length > 0,
  };
}
