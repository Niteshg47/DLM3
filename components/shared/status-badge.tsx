import { cn } from "@/lib/utils";
import { caseStatusStyles } from "@/lib/design/tokens";
import { invoiceStatusStyles } from "@/lib/design/tokens";
import type { CaseStatus, CasePriority } from "@prisma/client";
import type { DisplayInvoiceStatus } from "@/lib/invoices";

export function CaseStatusBadge({
  status,
  label,
}: {
  status: CaseStatus;
  label: string;
}) {
  const s = caseStatusStyles[status] ?? caseStatusStyles.RECEIVED;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.bg,
        s.text
      )}
    >
      {label}
    </span>
  );
}

export function InvoiceStatusBadge({
  status,
  label,
}: {
  status: DisplayInvoiceStatus;
  label: string;
}) {
  const s = invoiceStatusStyles[status] ?? invoiceStatusStyles.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.bg,
        s.text
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  label,
}: {
  priority: CasePriority;
  label: string;
}) {
  const styles: Record<CasePriority, string> = {
    NORMAL: "bg-slate-100 text-slate-700",
    URGENT: "bg-rose-100 text-rose-700",
    STAT: "bg-red-100 text-red-700 animate-pulse-stat ring-1 ring-red-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[priority]
      )}
    >
      {label}
    </span>
  );
}
