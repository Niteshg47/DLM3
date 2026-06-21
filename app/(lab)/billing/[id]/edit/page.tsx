import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getInvoiceById } from "@/lib/data/invoices";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/billing/invoice-form";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantFromRequest();
  const invoice = await getInvoiceById(tenant.id, id);

  if (!invoice) notFound();
  if (invoice.status !== "DRAFT") redirect(`/billing/${id}`);

  const doctors = await prisma.doctor.findMany({
    where: { tenantId: tenant.id },
    include: { user: { select: { name: true } } },
  });

  return (
    <div>
      <Link href={`/billing/${id}`} className="text-sm text-brand-indigo hover:underline">
        ← Invoice
      </Link>
      <PageHeader title={`Edit ${invoice.invoiceNumber}`} />
      <InvoiceForm
        invoiceId={invoice.id}
        doctors={doctors.map((d) => ({ id: d.id, name: d.user.name }))}
        defaultDoctorId={invoice.doctorId}
        defaultCaseId={invoice.caseId ?? ""}
        prefilledItems={invoice.items.map((i) => ({
          description: i.description,
          qty: i.qty,
          unitPrice: i.unitPriceNum,
        }))}
        defaultIssuedAt={invoice.issuedAt.toISOString().slice(0, 10)}
        defaultDueDate={invoice.dueDate?.toISOString().slice(0, 10)}
        defaultApplyGst={invoice.taxNum > 0}
      />
    </div>
  );
}
