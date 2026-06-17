"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireLabRole, requireDoctorRole, requireAdminRole, auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { deleteFile } from "@/lib/s3";
import {
  createCaseSchema,
  updateCaseSchema,
  doctorSubmitCaseSchema,
} from "@/lib/validations/case";
import { generateCaseNumber } from "@/lib/cases";
import { logAudit } from "@/lib/audit";
import { notifyDoctorUser } from "@/lib/notifications";
import type { CaseStatus } from "@prisma/client";

async function assertTenantAccess(tenantId: string) {
  const session = await auth();
  if (!session?.user || session.user.tenantId !== tenantId) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function createCaseAction(formData: FormData) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  if (tenant.id !== session.user.tenantId) {
    throw new Error("FORBIDDEN");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = createCaseSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const caseNumber = await generateCaseNumber(tenant.id);
  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const newCase = await prisma.case.create({
    data: {
      tenantId: tenant.id,
      caseNumber,
      doctorId: parsed.data.doctorId,
      patientName: parsed.data.patientName,
      patientAge: parsed.data.patientAge ?? null,
      patientGender: parsed.data.patientGender ?? null,
      caseType: parsed.data.caseType,
      priority: parsed.data.priority,
      dueDate,
      notes: parsed.data.notes ?? null,
      shade: parsed.data.shade ?? null,
      units: parsed.data.units,
    },
  });

  // Link any pre-uploaded S3 files to the newly created case
  const uploadedFilesStr = formData.get("uploadedFiles") as string;
  if (uploadedFilesStr) {
    try {
      const uploadedFiles = JSON.parse(uploadedFilesStr) as {
        name: string;
        size: number;
        mimeType: string;
        s3Key: string;
      }[];

      if (uploadedFiles && uploadedFiles.length > 0) {
        await Promise.all(
          uploadedFiles.map((file) =>
            prisma.caseFile.create({
              data: {
                caseId: newCase.id,
                tenantId: tenant.id,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType,
                s3Key: file.s3Key,
                uploadedBy: session.user.id,
              },
            })
          )
        );
      }
    } catch (e) {
      console.error("Failed to link uploaded files to case:", e);
    }
  }

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "CREATE",
    entity: "Case",
    entityId: newCase.id,
    meta: { caseNumber },
  });

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true, id: newCase.id };
}

export async function updateCaseAction(caseId: string, formData: FormData) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateCaseSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const existing = await prisma.case.findFirst({
    where: { id: caseId, tenantId: tenant.id },
  });

  if (!existing) {
    return { error: "not_found" };
  }

  const { status, statusNote, dueDate, ...rest } = parsed.data;

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      ...rest,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      status: status ?? undefined,
      notes:
        statusNote && existing.notes
          ? `${existing.notes}\n\n[${new Date().toISOString()}] ${statusNote}`
          : statusNote
            ? statusNote
            : rest.notes !== undefined
              ? rest.notes
              : undefined,
      deliveredAt:
        status === "DELIVERED" && !existing.deliveredAt
          ? new Date()
          : existing.deliveredAt,
    },
  });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Case",
    entityId: caseId,
    meta: { status, fields: Object.keys(parsed.data) },
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true, case: updated };
}

export async function updateCaseStatusAction(
  caseId: string,
  status: CaseStatus,
  note?: string
) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const existing = await prisma.case.findFirst({
    where: { id: caseId, tenantId: tenant.id },
  });

  if (!existing) return { error: "not_found" };

  const notes = note
    ? `${existing.notes ?? ""}\n\n[${new Date().toISOString()}] Status → ${status}: ${note}`.trim()
    : existing.notes;

  await prisma.case.update({
    where: { id: caseId },
    data: {
      status,
      notes,
      deliveredAt:
        status === "DELIVERED" && !existing.deliveredAt ? new Date() : existing.deliveredAt,
    },
  });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Case",
    entityId: caseId,
    meta: { status, note },
  });

  await notifyDoctorUser({
    tenantId: tenant.id,
    doctorId: existing.doctorId,
    type: "CASE_STATUS",
    message: `Case ${existing.caseNumber} status updated to ${status.replace(/_/g, " ")}.`,
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCaseAction(caseId: string) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const existing = await prisma.case.findFirst({
    where: { id: caseId, tenantId: tenant.id },
  });

  if (!existing) return { error: "not_found" };

  await prisma.case.delete({ where: { id: caseId } });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "DELETE",
    entity: "Case",
    entityId: caseId,
    meta: { caseNumber: existing.caseNumber },
  });

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function doctorSubmitCaseAction(formData: FormData) {
  const session = await requireDoctorRole();
  const tenant = await requireTenant();

  const raw = Object.fromEntries(formData.entries());
  const parsed = doctorSubmitCaseSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor || doctor.tenantId !== tenant.id) {
    return { error: "doctor_not_found" };
  }

  const caseNumber = await generateCaseNumber(tenant.id);
  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const newCase = await prisma.case.create({
    data: {
      tenantId: tenant.id,
      caseNumber,
      doctorId: doctor.id,
      patientName: parsed.data.patientName,
      patientAge: parsed.data.patientAge ?? null,
      patientGender: parsed.data.patientGender ?? null,
      caseType: parsed.data.caseType,
      priority: parsed.data.priority,
      dueDate,
      notes: parsed.data.notes ?? null,
      shade: parsed.data.shade ?? null,
      units: parsed.data.units,
      status: "RECEIVED",
    },
  });

  // Link uploaded files to the newly created case
  const uploadedFilesStr = formData.get("uploadedFiles") as string;
  if (uploadedFilesStr) {
    try {
      const uploadedFiles = JSON.parse(uploadedFilesStr) as {
        name: string;
        size: number;
        mimeType: string;
        s3Key: string;
      }[];

      if (uploadedFiles && uploadedFiles.length > 0) {
        await Promise.all(
          uploadedFiles.map((file) =>
            prisma.caseFile.create({
              data: {
                caseId: newCase.id,
                tenantId: tenant.id,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType,
                s3Key: file.s3Key,
                uploadedBy: session.user.id,
              },
            })
          )
        );
      }
    } catch (e) {
      console.error("Failed to link uploaded files to case:", e);
    }
  }

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "CREATE",
    entity: "Case",
    entityId: newCase.id,
    meta: { caseNumber, source: "doctor_portal" },
  });

  revalidatePath("/doctor/portal");
  return { success: true, id: newCase.id };
}

export async function deleteCaseFileAction(fileId: string) {
  const session = await requireAdminRole();
  const tenant = await requireTenant();

  const caseFile = await prisma.caseFile.findFirst({
    where: { id: fileId, tenantId: tenant.id },
  });

  if (!caseFile) {
    return { error: "not_found" };
  }

  try {
    // Delete from S3
    await deleteFile(caseFile.s3Key);

    // Delete from DB
    await prisma.caseFile.delete({
      where: { id: fileId },
    });

    // Log audit
    await logAudit({
      tenantId: tenant.id,
      userId: session.user.id,
      action: "DELETE",
      entity: "CaseFile",
      entityId: fileId,
      meta: { name: caseFile.name },
    });

    revalidatePath(`/cases/${caseFile.caseId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete file" };
  }
}

export async function addCaseAttachmentAction(caseId: string, key: string) {
  const session = await requireLabRole();
  const tenant = await requireTenant();

  const existing = await prisma.case.findFirst({
    where: { id: caseId, tenantId: tenant.id },
  });

  if (!existing) return { error: "not_found" };

  await prisma.case.update({
    where: { id: caseId },
    data: {
      attachments: [...existing.attachments, key],
    },
  });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Case",
    entityId: caseId,
    meta: { attachment: key },
  });

  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}
