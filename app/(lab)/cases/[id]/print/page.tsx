import { notFound } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getCaseById } from "@/lib/data/cases";
import { formatDate } from "@/lib/utils";
import { PrintTrigger } from "@/components/lab/print-trigger";

export default async function CasePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantFromRequest();
  const caseData = await getCaseById(tenant.id, id);
  if (!caseData) notFound();

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
