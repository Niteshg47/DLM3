import { caseStatusStyles } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@prisma/client";

const flow: CaseStatus[] = [
  "RECEIVED",
  "IN_PROGRESS",
  "QC_HOLD",
  "READY",
  "DELIVERED",
  "INVOICED",
];

export function CaseTimeline({
  currentStatus,
  statusLabels,
}: {
  currentStatus: CaseStatus;
  statusLabels: Record<string, string>;
}) {
  const currentIdx = flow.indexOf(currentStatus);

  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <h3 className="font-semibold text-slate-800 mb-4">Timeline</h3>
      <ol className="relative border-l-2 border-slate-100 ml-3 space-y-6">
        {flow.map((status, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const s = caseStatusStyles[status];
          return (
            <li key={status} className="ml-6 relative">
              <span
                className={cn(
                  "absolute -left-[1.65rem] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white",
                  done ? s.dot : "bg-slate-200"
                )}
              />
              <p
                className={cn(
                  "text-sm font-medium",
                  active ? "text-brand-indigo" : done ? "text-slate-700" : "text-slate-400"
                )}
              >
                {statusLabels[status] ?? status}
              </p>
              {active && (
                <p className="text-xs text-muted-foreground mt-0.5">Current status</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
