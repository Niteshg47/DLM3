import Link from "next/link";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getInvoices, getInvoiceSummaries } from "@/lib/data/invoices";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceListClient } from "@/components/billing/invoice-list-client";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Wallet, AlertCircle, FileEdit, Download } from "lucide-react";
import type { InvoiceStatus } from "@prisma/client";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    doctorId?: string;
    page?: string;
  }>;
}) {
  let tenant, params;
  try {
    [tenant, params] = await Promise.all([getTenantFromRequest(), searchParams]);
  } catch (err) {
    console.error("[BillingPage] init failed:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to load workspace</h2>
        <p className="text-sm text-red-600">Could not connect to the lab workspace. Please refresh.</p>
      </div>
    );
  }

  const page = parseInt(params.page ?? "1", 10);

  let summaries, items, total, totalPages;
  try {
    const [s, listResult] = await Promise.all([
      getInvoiceSummaries(tenant.id),
      getInvoices(tenant.id, {
        status: params.status as InvoiceStatus | "OVERDUE" | undefined,
        doctorId: params.doctorId,
        page,
      }),
    ]);
    summaries = s;
    items = listResult.items;
    total = listResult.total;
    totalPages = listResult.totalPages;
  } catch (err) {
    console.error("[BillingPage] data fetch failed:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Failed to load invoices</h2>
        <p className="text-sm text-red-600">There was a problem retrieving billing data. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage invoices and payments"
      >
        <Button variant="outline" size="sm" asChild>
          <a href="/api/invoices/export">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </a>
        </Button>
        <Button className="bg-brand-purple hover:bg-purple-600" asChild>
          <Link href="/billing/new">New invoice</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total billed"
          value={formatCurrency(summaries.totalBilled)}
          icon={Receipt}
          borderClass="gradient-border-top-purple"
          iconBg="bg-purple-100 text-brand-purple"
        />
        <StatCard
          title="Collected"
          value={formatCurrency(summaries.totalPaid)}
          icon={Wallet}
          borderClass="gradient-border-top-teal"
          iconBg="bg-teal-100 text-brand-teal"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(summaries.overdue)}
          icon={AlertCircle}
          borderClass="gradient-border-top-rose"
          iconBg="bg-rose-100 text-brand-rose"
        />
        <StatCard
          title="Draft"
          value={formatCurrency(summaries.draft)}
          icon={FileEdit}
          borderClass="gradient-border-top-amber"
          iconBg="bg-amber-100 text-brand-amber"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          illustration="invoices"
          title="No invoices yet"
          description="Create your first invoice from a case or start fresh."
          actionLabel="Create invoice"
          actionHref="/billing/new"
        />
      ) : (
        <>
          <InvoiceListClient items={items} />
          <p className="text-sm text-muted-foreground mt-4">
            {total} invoice{total !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </p>
        </>
      )}
    </div>
  );
}
