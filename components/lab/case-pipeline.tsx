import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { caseStatusStyles } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@prisma/client";

const columns: CaseStatus[] = [
  "RECEIVED",
  "IN_PROGRESS",
  "QC_HOLD",
  "READY",
  "DELIVERED",
  "INVOICED",
];

export async function CasePipeline({
  pipeline,
  statusLabels,
}: {
  pipeline: Record<CaseStatus, number>;
  statusLabels: Record<string, string>;
}) {
  const t = await getTranslations("dashboard");

  return (
    <div className="rounded-xl bg-white p-5 shadow-card transition-all duration-200 hover:shadow-md">
      <h3 className="font-semibold text-slate-800 mb-4">{t("pipeline")}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {columns.map((status) => {
          const s = caseStatusStyles[status];
          return (
            <Link
              key={status}
              href={`/cases?status=${status}`}
              className="rounded-xl border border-slate-100 p-4 text-center transition-all duration-200 hover:border-brand-indigo hover:shadow-md hover:-translate-y-0.5 bg-white"
            >
              <p className="text-2xl font-bold text-slate-900">{pipeline[status] ?? 0}</p>
              <p className={cn("text-xs font-medium mt-2 rounded-full px-2 py-0.5 inline-block", s.bg, s.text)}>
                {statusLabels[status] ?? status}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
