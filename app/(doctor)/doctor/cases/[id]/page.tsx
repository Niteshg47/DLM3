import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DoctorCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let id: string;
  let session: any;
  let tenant: Awaited<ReturnType<typeof getTenantFromRequest>>;
  let t: Awaited<ReturnType<typeof getTranslations>>;
  let tStatus: Awaited<ReturnType<typeof getTranslations>>;

  try {
    ({ id } = await params);
    session = await auth();
    tenant = await getTenantFromRequest();
    t = await getTranslations("cases");
    tStatus = await getTranslations("caseStatus");
  } catch (err) {
    console.error("[DoctorCaseDetailPage] init failed:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to load case</h2>
        <p className="text-sm text-red-600">
          Could not connect to the workspace. Please refresh or contact support.
        </p>
      </div>
    );
  }

  let doctor: Awaited<ReturnType<typeof prisma.doctor.findUnique>> = null;
  let caseData: any = null;

  try {
    doctor = await prisma.doctor.findUnique({
      where: { userId: session!.user.id },
    });

    if (doctor) {
      caseData = await prisma.case.findFirst({
        where: { id, tenantId: tenant.id, doctorId: doctor.id },
        select: {
          caseNumber: true,
          patientName: true,
          patientAge: true,
          patientGender: true,
          caseType: true,
          priority: true,
          status: true,
          receivedAt: true,
          dueDate: true,
          notes: true,
          shade: true,
          units: true,
        },
      });
    }
  } catch (err) {
    console.error("[DoctorCaseDetailPage] data fetch failed:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Failed to load case</h2>
        <p className="text-sm text-red-600">
          Could not load this case right now. Please try again shortly.
        </p>
      </div>
    );
  }

  if (!doctor) notFound();
  if (!caseData) notFound();

  return (
    <div className="space-y-6">
      <Link href="/doctor/portal" className="text-sm text-muted-foreground hover:underline">
        ← {t("title")}
      </Link>
      <h1 className="text-2xl font-bold">{caseData.caseNumber}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">{t("patient")}: </span>
            {caseData.patientName}
          </p>
          <p>
            <span className="text-muted-foreground">{t("status")}: </span>
            <CaseStatusBadge status={caseData.status} label={tStatus(caseData.status)} />
          </p>
          <p>
            <span className="text-muted-foreground">{t("received")}: </span>
            {formatDate(caseData.receivedAt)}
          </p>
          <p>
            <span className="text-muted-foreground">{t("dueDate")}: </span>
            {formatDate(caseData.dueDate)}
          </p>
          {caseData.notes && (
            <div>
              <p className="text-muted-foreground mb-1">{t("notes")}</p>
              <pre className="whitespace-pre-wrap font-sans bg-muted/50 p-3 rounded-md">
                {caseData.notes}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
