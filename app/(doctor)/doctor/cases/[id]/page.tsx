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
  const { id } = await params;
  const session = await auth();
  const tenant = await getTenantFromRequest();
  const t = await getTranslations("cases");
  const tStatus = await getTranslations("caseStatus");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });

  if (!doctor) notFound();

  const caseData = await prisma.case.findFirst({
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
