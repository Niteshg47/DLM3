import { getTranslations } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { CaseForm } from "@/components/lab/case-form";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  let tenant;
  let t;
  let doctors;

  try {
    [tenant, t] = await Promise.all([
      getTenantFromRequest(),
      getTranslations("cases"),
    ]);

    doctors = await prisma.doctor.findMany({
      where: { tenantId: tenant.id },
      include: { user: { select: { name: true } } },
    });
  } catch (err) {
    console.error("[NewCasePage] failed to load case form data:", err);
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Failed to load form</h2>
        <p className="text-sm text-red-600">
          We could not load the case form right now. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("newCase")}</h1>
      <CaseForm
        doctors={doctors.map((d) => ({ id: d.id, name: d.user.name }))}
      />
    </div>
  );
}
