import { z } from "zod";

export const caseTypeEnum = z.enum([
  "CROWN",
  "BRIDGE",
  "DENTURE",
  "IMPLANT",
  "ALIGNER",
  "OTHER",
]);

export const casePriorityEnum = z.enum(["NORMAL", "URGENT", "STAT"]);

export const caseStatusEnum = z.enum([
  "RECEIVED",
  "IN_PROGRESS",
  "QC_HOLD",
  "READY",
  "DELIVERED",
  "INVOICED",
]);

export const createCaseSchema = z.object({
  doctorId: z.string().min(1),
  patientName: z.string().min(1).max(200),
  patientAge: z.coerce.number().int().min(0).max(150).optional().nullable(),
  patientGender: z.string().max(20).optional().nullable(),
  caseType: caseTypeEnum,
  priority: casePriorityEnum.default("NORMAL"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  shade: z.string().max(50).optional().nullable(),
  units: z.coerce.number().int().min(1).max(32).default(1),
});

export const updateCaseSchema = createCaseSchema.partial().extend({
  status: caseStatusEnum.optional(),
  statusNote: z.string().max(1000).optional(),
});

export const doctorSubmitCaseSchema = z.object({
  patientName: z.string().min(1).max(200),
  patientAge: z.coerce.number().int().min(0).max(150).optional().nullable(),
  patientGender: z.string().max(20).optional().nullable(),
  caseType: caseTypeEnum,
  priority: casePriorityEnum.default("NORMAL"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  shade: z.string().max(50).optional().nullable(),
  units: z.coerce.number().int().min(1).max(32).default(1),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type DoctorSubmitCaseInput = z.infer<typeof doctorSubmitCaseSchema>;
