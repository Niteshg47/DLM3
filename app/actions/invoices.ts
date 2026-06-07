"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireLabRole, auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  type LineItemInput,
} from "@/lib/validations/invoice";
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
} from "@/lib/invoices";
import { logAudit } from "@/lib/audit";
import { notifyDoctorUser } from "@/lib/notifications";
import type { InvoiceStatus } from "@prisma/client";

function parseItemsFromForm(formData: FormData) {
  const raw = formData.get("items");
  if (!raw || typeof raw !== "string") return [];
  return JSON.parse(raw) as { description: string; qty: number; unitPrice: number }[];
}

export async function createInvoiceAction(formData: FormData) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const items = parseItemsFromForm(formData);
  const parsed = createInvoiceSchema.safeParse({
    doctorId: formData.get("doctorId"),
    caseId: formData.get("caseId") || null,
    issuedAt: formData.get("issuedAt"),
    dueDate: formData.get("dueDate") || null,
    applyGst: formData.get("applyGst") === "true",
    sendNow: formData.get("sendNow") === "true",
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { subtotal, tax, total } = calculateInvoiceTotals(
    parsed.data.items,
    parsed.data.applyGst
  );

  const invoiceNumber = await generateInvoiceNumber(tenant.id);
  const status: InvoiceStatus = parsed.data.sendNow ? "SENT" : "DRAFT";

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      doctorId: parsed.data.doctorId,
      caseId: parsed.data.caseId || null,
      invoiceNumber,
      issuedAt: new Date(parsed.data.issuedAt),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      status,
      subtotal,
      tax,
      total,
      items: {
        create: parsed.data.items.map((item: LineItemInput) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.qty * item.unitPrice,
        })),
      },
    },
  });

  if (parsed.data.caseId) {
    await prisma.case.update({
      where: { id: parsed.data.caseId },
      data: { status: "INVOICED" },
    });
  }

  if (status === "SENT") {
    await notifyDoctorUser({
      tenantId: tenant.id,
      doctorId: parsed.data.doctorId,
      type: "INVOICE_SENT",
      message: `Invoice ${invoiceNumber} has been sent. Amount: ₹${total.toLocaleString("en-IN")}`,
    });
  }

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "CREATE",
    entity: "Invoice",
    entityId: invoice.id,
    meta: { invoiceNumber, status },
  });

  revalidatePath("/billing");
  redirect(`/billing/${invoice.id}`);
}

export async function updateInvoiceAction(invoiceId: string, formData: FormData) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: tenant.id },
  });

  if (!existing || existing.status !== "DRAFT") {
    return { error: "not_editable" };
  }

  const items = parseItemsFromForm(formData);
  const parsed = updateInvoiceSchema.safeParse({
    doctorId: formData.get("doctorId"),
    caseId: formData.get("caseId") || null,
    issuedAt: formData.get("issuedAt"),
    dueDate: formData.get("dueDate") || null,
    applyGst: formData.get("applyGst") === "true",
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { subtotal, tax, total } = calculateInvoiceTotals(
    parsed.data.items,
    parsed.data.applyGst
  );

  await prisma.invoiceItem.deleteMany({ where: { invoiceId } });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      doctorId: parsed.data.doctorId,
      caseId: parsed.data.caseId || null,
      issuedAt: new Date(parsed.data.issuedAt),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      subtotal,
      tax,
      total,
      items: {
        create: parsed.data.items.map((item: LineItemInput) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.qty * item.unitPrice,
        })),
      },
    },
  });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Invoice",
    entityId: invoiceId,
  });

  revalidatePath(`/billing/${invoiceId}`);
  revalidatePath("/billing");
  return { success: true };
}

export async function sendInvoiceAction(invoiceId: string) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: tenant.id },
  });

  if (!invoice) return { error: "not_found" };

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "SENT" },
  });

  await notifyDoctorUser({
    tenantId: tenant.id,
    doctorId: invoice.doctorId,
    type: "INVOICE_SENT",
    message: `Invoice ${invoice.invoiceNumber} has been sent.`,
  });

  revalidatePath(`/billing/${invoiceId}`);
  revalidatePath("/billing");
  return { success: true };
}

export async function markInvoicePaidAction(invoiceId: string) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  await prisma.invoice.updateMany({
    where: { id: invoiceId, tenantId: tenant.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Invoice",
    entityId: invoiceId,
    meta: { status: "PAID" },
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function bulkMarkInvoicesPaidAction(ids: string[]) {
  await requireLabRole();
  const tenant = await requireTenant();

  await prisma.invoice.updateMany({
    where: { id: { in: ids }, tenantId: tenant.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function bulkSendReminderAction(ids: string[]) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const invoices = await prisma.invoice.findMany({
    where: { id: { in: ids }, tenantId: tenant.id },
  });

  for (const inv of invoices) {
    await notifyDoctorUser({
      tenantId: tenant.id,
      doctorId: inv.doctorId,
      type: "INVOICE_SENT",
      message: `Reminder: Invoice ${inv.invoiceNumber} payment is due.`,
    });
  }

  return { success: true, count: invoices.length };
}
