import { prisma } from "@/lib/prisma";
import type { CaseStatus, CaseType, CasePriority, Prisma } from "@prisma/client";

export type CaseListFilters = {
  search?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  caseType?: CaseType;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sort?: "receivedAt" | "dueDate" | "caseNumber";
  order?: "asc" | "desc";
};

export async function getCases(
  tenantId: string,
  filters: CaseListFilters = {}
) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.CaseWhereInput = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.caseType) where.caseType = filters.caseType;
  if (filters.doctorId) where.doctorId = filters.doctorId;

  if (filters.search) {
    where.OR = [
      { caseNumber: { contains: filters.search, mode: "insensitive" } },
      { patientName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.receivedAt = {};
    if (filters.dateFrom) {
      where.receivedAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.receivedAt.lte = new Date(filters.dateTo);
    }
  }

  const orderBy: Prisma.CaseOrderByWithRelationInput = {
    [filters.sort ?? "receivedAt"]: filters.order ?? "desc",
  };

  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.case.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getCaseById(tenantId: string, caseId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, tenantId },
    include: {
      doctor: { include: { user: { select: { name: true, email: true } } } },
      tasks: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getDoctorCases(tenantId: string, doctorId: string) {
  return prisma.case.findMany({
    where: { tenantId, doctorId },
    orderBy: { receivedAt: "desc" },
    select: {
      id: true,
      caseNumber: true,
      patientName: true,
      caseType: true,
      priority: true,
      status: true,
      receivedAt: true,
      dueDate: true,
      notes: true,
    },
  });
}
