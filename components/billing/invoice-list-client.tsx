"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { bulkMarkInvoicesPaidAction, bulkSendReminderAction } from "@/app/actions/invoices";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceWithDisplay } from "@/lib/data/invoices";
import type { DisplayInvoiceStatus } from "@/lib/invoices";

const statusLabels: Record<DisplayInvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export function InvoiceListClient({ items }: { items: InvoiceWithDisplay[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkPaid() {
    startTransition(async () => {
      await bulkMarkInvoicesPaidAction(Array.from(selected));
      setSelected(new Set());
    });
  }

  function bulkReminder() {
    startTransition(async () => {
      await bulkSendReminderAction(Array.from(selected));
      setSelected(new Set());
    });
  }

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-b">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" disabled={pending} onClick={bulkPaid}>
            Mark paid
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={bulkReminder}>
            Send reminder
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 border-b z-10">
            <tr>
              <th className="p-3 w-10" />
              <th className="text-left p-3 font-semibold">Invoice #</th>
              <th className="text-left p-3 font-semibold">Case #</th>
              <th className="text-left p-3 font-semibold">Doctor</th>
              <th className="text-left p-3 font-semibold hidden md:table-cell">Issued</th>
              <th className="text-left p-3 font-semibold hidden lg:table-cell">Due</th>
              <th className="text-right p-3 font-semibold">Amount</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((inv, i) => (
              <tr
                key={inv.id}
                className={`border-b transition-colors duration-200 hover:bg-indigo-50/50 ${
                  i % 2 === 1 ? "bg-brand-canvas" : ""
                }`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(inv.id)}
                    onChange={() => toggle(inv.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3 font-medium">
                  <Link href={`/billing/${inv.id}`} className="text-brand-indigo hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{inv.caseNumber ?? "—"}</td>
                <td className="p-3">{inv.doctorName}</td>
                <td className="p-3 hidden md:table-cell">{formatDate(inv.issuedAt)}</td>
                <td className="p-3 hidden lg:table-cell">{formatDate(inv.dueDate)}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(inv.total)}</td>
                <td className="p-3">
                  <InvoiceStatusBadge
                    status={inv.displayStatus}
                    label={statusLabels[inv.displayStatus]}
                  />
                </td>
                <td className="p-3">
                  <Link
                    href={`/billing/${inv.id}`}
                    className="text-xs text-brand-indigo hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
