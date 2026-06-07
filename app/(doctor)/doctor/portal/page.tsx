import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { CaseStatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default async function DoctorPortalPage() {
  const session = await auth();
  const tenant = await getTenantFromRequest();
  const t = await getTranslations("doctor");
  const tStatus = await getTranslations("caseStatus");
  const tCases = await getTranslations("cases");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });

  if (!doctor) {
    return <p>Doctor profile not found.</p>;
  }

  const cases = await prisma.case.findMany({
    where: { tenantId: tenant.id, doctorId: doctor.id },
    orderBy: { receivedAt: "desc" },
    select: {
      id: true,
      caseNumber: true,
      patientName: true,
      caseType: true,
      status: true,
      receivedAt: true,
      dueDate: true,
    },
  });

  return (
    <div>
      <PageHeader title={t("myCases")} description="Track your submitted cases">
        <Button className="bg-brand-sky hover:bg-sky-600" asChild>
          <Link href="/doctor/submit">{t("submitCase")}</Link>
        </Button>
      </PageHeader>

      {cases.length === 0 ? (
        <EmptyState
          illustration="cases"
          title="No cases yet"
          description="Submit your first case to the lab in just a few clicks."
          actionLabel={t("submitCase")}
          actionHref="/doctor/submit"
        />
      ) : (
        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-sky-900">{tCases("caseNumber")}</th>
                <th className="text-left p-3 font-semibold text-sky-900">{tCases("patient")}</th>
                <th className="text-left p-3 font-semibold text-sky-900">{tCases("status")}</th>
                <th className="text-left p-3 font-semibold text-sky-900 hidden sm:table-cell">
                  {tCases("dueDate")}
                </th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b transition-colors hover:bg-sky-50/50 ${
                    i % 2 === 1 ? "bg-sky-50/30" : ""
                  }`}
                >
                  <td className="p-3 font-medium text-sky-900">{c.caseNumber}</td>
                  <td className="p-3">{c.patientName}</td>
                  <td className="p-3">
                    <CaseStatusBadge status={c.status} label={tStatus(c.status)} />
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">
                    {formatDate(c.dueDate)}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/doctor/cases/${c.id}`}
                      className="text-brand-sky font-medium hover:underline"
                    >
                      {t("trackCase")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
