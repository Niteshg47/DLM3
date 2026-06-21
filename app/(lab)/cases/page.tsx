import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getCases } from "@/lib/data/cases";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { AvatarInitials } from "@/components/shared/avatar-initials";
import { CaseFilters } from "@/components/lab/case-filters";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Paperclip } from "lucide-react";
import type { CaseStatus, CaseType, CasePriority } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    caseType?: string;
    doctorId?: string;
    page?: string;
  }>;
}) {
  let tenant: Awaited<ReturnType<typeof getTenantFromRequest>>;
  let params: Awaited<typeof searchParams>;
  let t: Awaited<ReturnType<typeof getTranslations>>;
  let tStatus: Awaited<ReturnType<typeof getTranslations>>;
  let tType: Awaited<ReturnType<typeof getTranslations>>;
  let tPriority: Awaited<ReturnType<typeof getTranslations>>;

  try {
    [tenant, params, t, tStatus, tType, tPriority] = await Promise.all([
      getTenantFromRequest(),
      searchParams,
      getTranslations("cases"),
      getTranslations("caseStatus"),
      getTranslations("caseType"),
      getTranslations("priority"),
    ]);
  } catch (err) {
    console.error("[CasesPage] init failed:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to load workspace</h2>
        <p className="text-sm text-red-600">
          Could not connect to the lab workspace. Please refresh or contact support.
        </p>
      </div>
    );
  }

  const page = parseInt(params.page ?? "1", 10);

  let items: Awaited<ReturnType<typeof getCases>>["items"] = [];
  let total = 0;
  let totalPages = 1;
  let doctors: { id: string; user: { name: string } }[] = [];
  let dataError: string | null = null;

  try {
    const result = await getCases(tenant.id, {
      search: params.search,
      status: params.status as CaseStatus | undefined,
      priority: params.priority as CasePriority | undefined,
      caseType: params.caseType as CaseType | undefined,
      doctorId: params.doctorId,
      page,
    });
    items = result.items;
    total = result.total;
    totalPages = result.totalPages;

    doctors = await prisma.doctor.findMany({
      where: { tenantId: tenant.id },
      include: { user: { select: { name: true } } },
    });
  } catch (err) {
    console.error("[CasesPage] data fetch failed:", err);
    dataError = "Failed to load cases from the database. Please try again shortly.";
  }

  return (
    <div>
      <PageHeader title={t("title")} description={`${total} cases in your lab`}>
        <Button className="bg-brand-indigo hover:bg-indigo-600" asChild>
          <Link href="/cases/new">{t("newCase")}</Link>
        </Button>
      </PageHeader>

      <CaseFilters doctors={doctors.map((d) => ({ id: d.id, name: d.user.name }))} />

      {dataError ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-4">
          <h2 className="text-base font-semibold text-red-700 mb-1">Failed to load cases</h2>
          <p className="text-sm text-red-600">{dataError}</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          illustration="cases"
          title="No cases found"
          description="Try adjusting filters or create a new case intake."
          actionLabel={t("newCase")}
          actionHref="/cases/new"
        />
      ) : (
        <div className="rounded-xl bg-white shadow-card overflow-hidden mt-4">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b z-10">
                <tr>
                  <th className="text-left p-3 font-semibold">{t("caseNumber")}</th>
                  <th className="text-left p-3 font-semibold">{t("patient")}</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">{t("doctor")}</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell">{t("type")}</th>
                  <th className="text-left p-3 font-semibold">{t("status")}</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">{t("dueDate")}</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell" title="Attachments">
                    <Paperclip className="h-4 w-4" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b transition-colors duration-200 hover:bg-indigo-50/60 ${
                      i % 2 === 1 ? "bg-brand-canvas" : ""
                    }`}
                  >
                    <td className="p-3">
                      <Link
                        href={`/cases/${c.id}`}
                        className="font-semibold text-brand-indigo hover:underline"
                      >
                        {c.caseNumber}
                      </Link>
                    </td>
                    <td className="p-3">{c.patientName}</td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <AvatarInitials name={c.doctor.user.name} size="sm" />
                        <span>{c.doctor.user.name}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">
                      {tType(c.caseType)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        <CaseStatusBadge status={c.status} label={tStatus(c.status)} />
                        <PriorityBadge priority={c.priority} label={tPriority(c.priority)} />
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {formatDate(c.dueDate)}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      {c._count.files > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                          <Paperclip className="h-3 w-3" />
                          {c._count.files}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between mt-4 text-sm">
          {page > 1 && (
            <Link
              href={`/cases?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>).toString()}`}
              className="text-brand-indigo hover:underline"
            >
              ← Previous
            </Link>
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/cases?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>).toString()}`}
              className="text-brand-indigo hover:underline"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
