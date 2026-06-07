import { prisma } from "@/lib/prisma";
import {
  resolveInvoiceDisplayStatus,
  decimalToNumber,
  type DisplayInvoiceStatus,
} from "@/lib/invoices";
import type { InvoiceStatus, Prisma } from "@prisma/client";

export type InvoiceListFilters = {
  status?: InvoiceStatus | "OVERDUE";
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type InvoiceWithDisplay = {
  id: string;
  invoiceNumber: string;
  issuedAt: Date;
  dueDate: Date | null;
  total: number;
  status: InvoiceStatus;
  displayStatus: DisplayInvoiceStatus;
  caseNumber: string | null;
  doctorName: string;
  doctorId: string;
  caseId: string | null;
};

export async function getInvoiceSummaries(tenantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    select: {
      status: true,
      total: true,
      dueDate: true,
      paidAt: true,
    },
  });

  let totalBilled = 0;
  let totalPaid = 0;
  let overdue = 0;
  let draft = 0;

  for (const inv of invoices) {
    const total = decimalToNumber(inv.total);
    const display = resolveInvoiceDisplayStatus(inv);

    if (inv.status !== "DRAFT") totalBilled += total;
    if (inv.status === "PAID") totalPaid += total;
    if (display === "OVERDUE") overdue += total;
    if (inv.status === "DRAFT") draft += total;
  }

  return { totalBilled, totalPaid, overdue, draft };
}

export async function getInvoices(tenantId: string, filters: InvoiceListFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.InvoiceWhereInput = { tenantId };

  if (filters.doctorId) where.doctorId = filters.doctorId;

  if (filters.dateFrom || filters.dateTo) {
    where.issuedAt = {};
    if (filters.dateFrom) where.issuedAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.issuedAt.lte = new Date(filters.dateTo);
  }

  if (filters.status && filters.status !== "OVERDUE") {
    where.status = filters.status;
  }

  const all = await prisma.invoice.findMany({
    where,
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      case: { select: { caseNumber: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  let filtered = all.map((inv) => ({
    ...inv,
    displayStatus: resolveInvoiceDisplayStatus(inv),
    totalNum: decimalToNumber(inv.total),
    doctorName: inv.doctor.user.name,
    caseNumber: inv.case?.caseNumber ?? null,
  }));

  if (filters.status === "OVERDUE") {
    filtered = filtered.filter((i) => i.displayStatus === "OVERDUE");
  }

  const total = filtered.length;
  const items = filtered.slice(skip, skip + pageSize);

  return {
    items: items.map(
      (i): InvoiceWithDisplay => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        issuedAt: i.issuedAt,
        dueDate: i.dueDate,
        total: i.totalNum,
        status: i.status,
        displayStatus: i.displayStatus,
        caseNumber: i.caseNumber,
        doctorName: i.doctorName,
        doctorId: i.doctorId,
        caseId: i.caseId,
      })
    ),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getInvoiceById(tenantId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      items: { orderBy: { id: "asc" } },
      doctor: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      case: { select: { caseNumber: true, caseType: true, patientName: true } },
      tenant: { select: { name: true, logoUrl: true, gstNumber: true, address: true } },
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    displayStatus: resolveInvoiceDisplayStatus(invoice),
    subtotalNum: decimalToNumber(invoice.subtotal),
    taxNum: decimalToNumber(invoice.tax),
    totalNum: decimalToNumber(invoice.total),
    items: invoice.items.map((item) => ({
      ...item,
      unitPriceNum: decimalToNumber(item.unitPrice),
      totalNum: decimalToNumber(item.total),
    })),
  };
}
