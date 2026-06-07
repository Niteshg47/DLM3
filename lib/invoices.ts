import { prisma } from "@/lib/prisma";
import type { InvoiceStatus } from "@prisma/client";

export type DisplayInvoiceStatus = InvoiceStatus | "OVERDUE";

export function resolveInvoiceDisplayStatus(invoice: {
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt: Date | null;
}): DisplayInvoiceStatus {
  if (invoice.status === "PAID" || invoice.status === "DRAFT") {
    return invoice.status;
  }
  if (
    invoice.status === "SENT" &&
    invoice.dueDate &&
    invoice.dueDate < new Date() &&
    !invoice.paidAt
  ) {
    return "OVERDUE";
  }
  return invoice.status;
}

export async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const last = await prisma.invoice.findFirst({
    where: { tenantId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
  });

  let nextNum = 1;
  if (last) {
    const parts = last.invoiceNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export function calculateInvoiceTotals(
  items: { qty: number; unitPrice: number }[],
  applyGst: boolean
) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const tax = applyGst ? subtotal * 0.18 : 0;
  const total = subtotal + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/** Default line item from case type */
export function defaultLineItemForCaseType(caseType: string, units: number) {
  const prices: Record<string, number> = {
    CROWN: 3500,
    BRIDGE: 8000,
    DENTURE: 12000,
    IMPLANT: 15000,
    ALIGNER: 25000,
    OTHER: 2000,
  };
  const unitPrice = prices[caseType] ?? 2000;
  return {
    description: `${caseType.replace("_", " ")} fabrication`,
    qty: units,
    unitPrice,
    total: units * unitPrice,
  };
}

export function decimalToNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : parseFloat(value.toString());
}
