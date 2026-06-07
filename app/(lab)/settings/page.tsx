import { getTranslations } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { PageHeader } from "@/components/shared/page-header";

export default async function SettingsPage() {
  const t = await getTranslations("nav");
  const tenant = await getTenantFromRequest();

  return (
    <div>
      <PageHeader title={t("settings")} description="Lab profile and preferences" />
      <div className="rounded-xl bg-white p-6 shadow-card max-w-2xl space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: tenant.brandColor }}
          >
            {tenant.name[0]}
          </div>
          <div>
            <p className="font-semibold text-lg">{tenant.name}</p>
            <p className="text-sm text-muted-foreground">Slug: {tenant.slug}</p>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-medium mt-1">{tenant.plan}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">GST number</dt>
            <dd className="font-medium mt-1">{tenant.gstNumber ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Address</dt>
            <dd className="font-medium mt-1">{tenant.address ?? "—"}</dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground pt-4 border-t">
          Full settings editor — coming in a future release.
        </p>
      </div>
    </div>
  );
}
