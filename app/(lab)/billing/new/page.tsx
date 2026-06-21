import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/billing/invoice-form";
import { defaultLineItemForCaseType } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  let tenant, caseId;
  try {
    [tenant, { caseId }] = await Promise.all([getTenantFromRequest(), searchParams]);
  } catch (err) {
    console.error("[NewInvoicePage] init failed:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to load workspace</h2>
        <p className="text-sm text-red-600">Could not connect to the lab workspace. Please refresh.</p>
      </div>
    );
  }

  let doctors;
  try {
    doctors = await prisma.doctor.findMany({
      where: { tenantId: tenant.id },
      include: { user: { select: { name: true } } },
    });
  } catch (err) {
    console.error("[NewInvoicePage] doctor fetch failed:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Failed to load doctors</h2>
        <p className="text-sm text-red-600">There was a problem retrieving data. Please try again.</p>
      </div>
    );
  }

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
