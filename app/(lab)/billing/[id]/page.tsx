import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getInvoiceById } from "@/lib/data/invoices";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { InvoiceActions } from "@/components/billing/invoice-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DisplayInvoiceStatus } from "@/lib/invoices";

const statusLabels: Record<DisplayInvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantFromRequest();
  const invoice = await getInvoiceById(tenant.id, id);
  if (!invoice) notFound();

  return (
    <div>
      <Link href="/billing" className="text-sm text-brand-indigo hover:underline">
        ← Billing
      </Link>
      <PageHeader title={invoice.invoiceNumber} description={invoice.doctor.clinicName}>
        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.displayStatus}
          canEdit={invoice.status === "DRAFT"}
        />
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge
              status={invoice.displayStatus}
              label={statusLabels[invoice.displayStatus]}
            />
            {invoice.case && (
              <span className="text-sm text-muted-foreground">
                Case: {invoice.case.caseNumber}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Doctor</p>
              <p className="font-medium">{invoice.doctor.user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Issued</p>
              <p className="font-medium">{formatDate(invoice.issuedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Due</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-muted-foreground">Paid</p>
                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
          </div>

          <table className="w-full text-sm mt-4">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-right p-2">Rate</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id} className={i % 2 === 1 ? "bg-brand-canvas" : ""}>
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-right">{item.qty}</td>
                  <td className="p-2 text-right">{formatCurrency(item.unitPriceNum)}</td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(item.totalNum)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-card h-fit sticky top-20">
          <h3 className="font-semibold mb-4">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotalNum)}</span>
            </div>
            {invoice.taxNum > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span>{formatCurrency(invoice.taxNum)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-brand-purple pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalNum)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
