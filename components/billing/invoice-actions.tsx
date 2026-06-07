"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Download, Send, CheckCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markInvoicePaidAction, sendInvoiceAction } from "@/app/actions/invoices";

export function InvoiceActions({
  invoiceId,
  status,
  canEdit,
}: {
  invoiceId: string;
  status: string;
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/invoices/${invoiceId}/pdf`} download>
          <Download className="h-4 w-4 mr-1" />
          PDF
        </a>
      </Button>
      {canEdit && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/billing/${invoiceId}/edit`}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </Button>
      )}
      {status === "DRAFT" && (
        <Button
          size="sm"
          className="bg-brand-sky hover:bg-sky-600"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await sendInvoiceAction(invoiceId);
            })
          }
        >
          <Send className="h-4 w-4 mr-1" />
          Send
        </Button>
      )}
      {(status === "SENT" || status === "OVERDUE") && (
        <Button
          size="sm"
          className="bg-brand-teal hover:bg-teal-700"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markInvoicePaidAction(invoiceId);
            })
          }
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Mark paid
        </Button>
      )}
    </div>
  );
}
