import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN" && session?.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Insights for your lab performance"
      />
      <AnalyticsDashboard />
    </div>
  );
}
