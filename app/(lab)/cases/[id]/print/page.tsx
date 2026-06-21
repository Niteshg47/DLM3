import { notFound } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getCaseById } from "@/lib/data/cases";
import { formatDate } from "@/lib/utils";
import { PrintTrigger } from "@/components/lab/print-trigger";

export const dynamic = "force-dynamic";

export default async function CasePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let tenant;
  let caseData;

  try {
    const { id } = await params;
    tenant = await getTenantFromRequest();
    caseData = await getCaseById(tenant.id, id);
    if (!caseData) {
      notFound();
    }
  } catch (err) {
    console.error("[CasePrintPage] failed to load print view:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Failed to load case print view</h2>
        <p className="text-sm text-red-600">
          We could not load this case sheet right now. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <PrintTrigger />
      <header className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">Case sheet · {caseData.caseNumber}</p>
      </header>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Patient</dt>
          <dd className="font-medium">{caseData.patientName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Doctor</dt>
          <dd className="font-medium">{caseData.doctor.user.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Type</dt>
          <dd>{caseData.caseType}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{caseData.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Received</dt>
          <dd>{formatDate(caseData.receivedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Due</dt>
          <dd>{formatDate(caseData.dueDate)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Shade / Units</dt>
          <dd>
            {caseData.shade ?? "—"} / {caseData.units}
          </dd>
        </div>
      </dl>
      {caseData.notes && (
        <section className="mt-6">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{caseData.notes}</p>
        </section>
      )}
    </div>
  );
}
