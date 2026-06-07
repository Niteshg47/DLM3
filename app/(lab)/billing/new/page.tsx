import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/billing/invoice-form";
import { defaultLineItemForCaseType } from "@/lib/invoices";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const tenant = await getTenantFromRequest();
  const { caseId } = await searchParams;

  const doctors = await prisma.doctor.findMany({
    where: { tenantId: tenant.id },
    include: { user: { select: { name: true } } },
  });

  let prefilled:
    | {
        doctorId: string;
        caseId: string;
        items: { description: string; qty: number; unitPrice: number }[];
      }
    | undefined;

  if (caseId) {
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, tenantId: tenant.id },
    });
    if (!caseData) notFound();
    const line = defaultLineItemForCaseType(caseData.caseType, caseData.units);
    prefilled = {
      doctorId: caseData.doctorId,
      caseId: caseData.id,
      items: [line],
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 15);

  return (
    <div>
      <Link href="/billing" className="text-sm text-brand-indigo hover:underline">
        ← Billing
      </Link>
      <PageHeader
        title="New invoice"
        description={prefilled ? `From case` : "Create a new invoice"}
      />
      <InvoiceForm
        doctors={doctors.map((d) => ({ id: d.id, name: d.user.name }))}
        defaultDoctorId={prefilled?.doctorId}
        defaultCaseId={prefilled?.caseId}
        prefilledItems={prefilled?.items}
        defaultIssuedAt={today}
        defaultDueDate={due.toISOString().slice(0, 10)}
      />
    </div>
  );
}
