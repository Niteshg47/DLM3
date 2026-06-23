import { redirect } from "next/navigation";
import { auth, requireAdminRole } from "@/lib/auth";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { OnboardingForm } from "@/components/lab/onboarding-form";
import { getTranslations } from "next-intl/server";

export default async function OnboardingPage() {
  await requireAdminRole();
  const tenant = await getTenantFromRequest();
  if (tenant.onboardingDone) {
    redirect("/dashboard");
  }

  const t = await getTranslations("onboarding");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">{t("title")}</h1>
        <OnboardingForm
          defaultName={tenant.name}
          defaultColor={tenant.brandColor}
          defaultTheme={tenant.themeSlug}
        />
      </div>
    </div>
  );
}
