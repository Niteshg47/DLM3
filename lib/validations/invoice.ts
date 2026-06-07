import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  qty: z.coerce.number().int().min(1).max(9999),
  unitPrice: z.coerce.number().min(0),
});

const invoiceBaseSchema = z.object({
  doctorId: z.string().min(1),
  caseId: z.string().optional().nullable(),
  issuedAt: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  applyGst: z.coerce.boolean().default(true),
  sendNow: z.coerce.boolean().default(false),
  items: z.array(lineItemSchema).min(1),
});

function withDueDateRefine<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data: z.infer<typeof invoiceBaseSchema>) => {
      if (!data.dueDate) return true;
      return new Date(data.dueDate) >= new Date(data.issuedAt);
    },
    { message: "Due date must be on or after issue date", path: ["dueDate"] }
  );
}

export const createInvoiceSchema = withDueDateRefine(invoiceBaseSchema);

export const updateInvoiceSchema = withDueDateRefine(
  invoiceBaseSchema.omit({ sendNow: true })
);

export type LineItemInput = z.infer<typeof lineItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
