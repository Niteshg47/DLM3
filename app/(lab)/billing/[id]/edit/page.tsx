import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getInvoiceById } from "@/lib/data/invoices";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/billing/invoice-form";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let tenant;
  let invoice;
  let doctors;

  try {
    const { id } = await params;
    tenant = await getTenantFromRequest();
    invoice = await getInvoiceById(tenant.id, id);

    if (!invoice) {
      notFound();
    }
    if (invoice.status !== "DRAFT") {
      redirect(`/billing/${id}`);
    }

    doctors = await prisma.doctor.findMany({
      where: { tenantId: tenant.id },
      include: { user: { select: { name: true } } },
    });
  } catch (err) {
    console.error("[EditInvoicePage] failed to load invoice editor:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Failed to load invoice editor</h2>
        <p className="text-sm text-red-600">
          We could not load the editor right now. Please refresh or try again shortly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/billing/${invoice.id}`} className="text-sm text-brand-indigo hover:underline">
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
      />
    </div>
  );
}
