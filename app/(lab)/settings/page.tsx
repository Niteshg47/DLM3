import { getTranslations } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getThemeLabel } from "@/lib/theme";
import { PageHeader } from "@/components/shared/page-header";
import { getStaffList, getStaffCount } from "@/app/actions/staff";
import { StaffManagement } from "@/components/settings/staff-management";
import { TenantSettingsForm } from "@/components/settings/tenant-settings-form";

export default async function SettingsPage() {
  const t = await getTranslations("nav");
  const tenant = await getTenantFromRequest();

  const [staff, staffCount] = await Promise.all([
    getStaffList(tenant.id),
    getStaffCount(tenant.id),
  ]);

  return (
    <div>
      <PageHeader title={t("settings")} description="Lab profile and preferences" />
      <div className="space-y-6">
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
            <div>
              <dt className="text-muted-foreground">Theme</dt>
              <dd className="font-medium mt-1">{getThemeLabel(tenant.themeSlug)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Custom domain</dt>
              <dd className="font-medium mt-1">{tenant.customDomain ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-medium mt-1">{tenant.address ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">WhatsApp notifications</dt>
              <dd className="font-medium mt-1">{tenant.whatsappEnabled ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
        </div>

        <TenantSettingsForm tenant={tenant} />

        <StaffManagement
          tenantId={tenant.id}
          staff={staff}
          staffCount={staffCount}
          maxStaff={3}
        />
      </div>
    </div>
  );
}
