import { getTranslations } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getDashboardStats } from "@/lib/data/dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CasePipeline } from "@/components/lab/case-pipeline";
import { ActivityFeed } from "@/components/lab/activity-feed";
import { FolderPlus, ShieldAlert, AlertTriangle, IndianRupee } from "lucide-react";

export default async function DashboardPage() {
  const tenant = await getTenantFromRequest();
  const t = await getTranslations("dashboard");
  const tStatus = await getTranslations("caseStatus");
  const stats = await getDashboardStats(tenant.id);

  const statusLabels: Record<string, string> = {
    RECEIVED: tStatus("RECEIVED"),
    IN_PROGRESS: tStatus("IN_PROGRESS"),
    QC_HOLD: tStatus("QC_HOLD"),
    READY: tStatus("READY"),
    DELIVERED: tStatus("DELIVERED"),
    INVOICED: tStatus("INVOICED"),
  };

  return (
    <div>
      <PageHeader title={t("title")} description={`Welcome back · ${tenant.name}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title={t("casesToday")}
          value={stats.casesToday}
          trend="+12% vs last month"
          icon={FolderPlus}
          borderClass="gradient-border-top-indigo"
          iconBg="bg-indigo-100 text-brand-indigo"
        />
        <StatCard
          title={t("pendingQc")}
          value={stats.pendingQc}
          icon={ShieldAlert}
          borderClass="gradient-border-top-amber"
          iconBg="bg-amber-100 text-brand-amber"
        />
        <StatCard
          title={t("overdue")}
          value={stats.overdue}
          icon={AlertTriangle}
          borderClass="gradient-border-top-rose"
          iconBg="bg-rose-100 text-brand-rose"
        />
        <StatCard
          title={t("revenueMonth")}
          value={formatCurrency(stats.revenueMonth)}
          trend="+8% vs last month"
          icon={IndianRupee}
          borderClass="gradient-border-top-purple"
          iconBg="bg-purple-100 text-brand-purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CasePipeline pipeline={stats.pipeline} statusLabels={statusLabels} />
        </div>
        <ActivityFeed
          items={stats.recentActivity.map((a) => ({
            id: a.id,
            action: a.action,
            entity: a.entity,
            userName: a.user?.name ?? "System",
            createdAt: formatDate(a.createdAt),
          }))}
        />
      </div>
    </div>
  );
}
