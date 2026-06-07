import { getTenantFromRequest } from "@/lib/tenant-context";
import { LoginForm } from "@/components/shared/login-form";
import { getTranslations } from "next-intl/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const tenant = await getTenantFromRequest();
  const t = await getTranslations("auth");
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-canvas">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white shadow-card overflow-hidden transition-all duration-200 hover:shadow-lg">
          <div
            className="px-6 py-8 text-center text-white"
            style={{
              background: `linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #1E1B4B 100%)`,
            }}
          >
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-12 mx-auto mb-3 object-contain"
              />
            ) : (
              <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {tenant.name[0]}
              </div>
            )}
            <h1 className="text-xl font-bold">Welcome back</h1>
            <p className="text-indigo-100 text-sm mt-1">{tenant.name}</p>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground text-center mb-4">{t("login")}</p>
            <LoginForm
              tenantId={tenant.id}
              labName={tenant.name}
              error={params.error}
            />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Dental Lab Portal · Secure sign-in
        </p>
      </div>
    </div>
  );
}
