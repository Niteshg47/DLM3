import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getCaseById } from "@/lib/data/cases";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { CaseStatusUpdater } from "@/components/lab/case-status-updater";
import { CaseTimeline } from "@/components/lab/case-timeline";
import { Button } from "@/components/ui/button";
import { FileText, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSignedUrl } from "@/lib/s3";
import { CaseAttachments } from "@/components/lab/case-attachments";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let id = "";
  let tenant;
  let session;
  let t;
  let tStatus;
  let tType;
  let tPriority;
  let caseData;
  let filesWithUrls = [];

  try {
    ({ id } = await params);
    tenant = await getTenantFromRequest();
    session = await auth();
    t = await getTranslations("cases");
    tStatus = await getTranslations("caseStatus");
    tType = await getTranslations("caseType");
    tPriority = await getTranslations("priority");

    caseData = await getCaseById(tenant.id, id);
    if (!caseData) {
      notFound();
    }

    filesWithUrls = await Promise.all(
      (caseData.files || []).map(async (file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        s3Key: file.s3Key,
        createdAt: file.createdAt.toISOString(),
        url: await getSignedUrl(file.s3Key),
      }))
    );
  } catch (err) {
    console.error("[CaseDetailPage] failed to load case data:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Failed to load case</h2>
        <p className="text-sm text-red-600">
          We could not load this case right now. Please refresh or try again shortly.
        </p>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const statusLabels: Record<string, string> = {
    RECEIVED: tStatus("RECEIVED"),
    IN_PROGRESS: tStatus("IN_PROGRESS"),
    QC_HOLD: tStatus("QC_HOLD"),
    READY: tStatus("READY"),
    DELIVERED: tStatus("DELIVERED"),
    INVOICED: tStatus("INVOICED"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 no-print">
        <div>
          <Link href="/cases" className="text-sm text-brand-indigo hover:underline">
            ← {t("title")}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{caseData.caseNumber}</h1>
          <p className="text-muted-foreground">{caseData.patientName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cases/${id}/print`}>
              <FileText className="h-4 w-4 mr-1" />
              {t("print")}
            </Link>
          </Button>
          <Button
            size="sm"
            className="bg-brand-purple hover:bg-purple-600"
            asChild
          >
            <Link href={`/billing/new?caseId=${id}`}>
              <Receipt className="h-4 w-4 mr-1" />
              Create invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-4">{t("details")}</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Detail label={t("patient")} value={caseData.patientName} />
              <Detail
                label="Age / Gender"
                value={
                  [caseData.patientAge, caseData.patientGender]
                    .filter(Boolean)
                    .join(" / ") || "—"
                }
              />
              <Detail label={t("doctor")} value={caseData.doctor.user.name} />
              <Detail label={t("type")} value={tType(caseData.caseType)} />
              <Detail label={t("priority")}>
                <PriorityBadge
                  priority={caseData.priority}
                  label={tPriority(caseData.priority)}
                />
              </Detail>
              <Detail label={t("status")}>
                <CaseStatusBadge
                  status={caseData.status}
                  label={tStatus(caseData.status)}
                />
              </Detail>
              <Detail label={t("received")} value={formatDate(caseData.receivedAt)} />
              <Detail label={t("dueDate")} value={formatDate(caseData.dueDate)} />
              <Detail label="Shade" value={caseData.shade ?? "—"} />
              <Detail label="Units" value={String(caseData.units)} />
            </div>
          </div>

          <CaseTimeline currentStatus={caseData.status} statusLabels={statusLabels} />

          <CaseAttachments
            caseId={caseData.id}
            initialFiles={filesWithUrls}
            isAdmin={isAdmin}
          />

          {caseData.notes && (
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h3 className="font-semibold mb-3">{t("notes")}</h3>
              <pre className="whitespace-pre-wrap text-sm font-sans text-slate-700 bg-brand-canvas p-4 rounded-lg">
                {caseData.notes}
              </pre>
            </div>
          )}

          {caseData.tasks.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h3 className="font-semibold mb-3">{t("tasks")}</h3>
              <ul className="space-y-2 text-sm">
                {caseData.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex justify-between border-b border-slate-50 pb-2 last:border-0"
                  >
                    <span>{task.title}</span>
                    <span className="text-muted-foreground">
                      {task.assignedTo?.name ?? "Unassigned"} · {task.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="no-print lg:sticky lg:top-20 lg:self-start space-y-4">
          <CaseStatusUpdater caseId={caseData.id} currentStatus={caseData.status} />
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <div className="font-medium mt-1 text-slate-800">{children ?? value}</div>
    </div>
  );
}
