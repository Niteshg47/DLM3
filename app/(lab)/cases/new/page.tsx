import { getTranslations } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";
import { CaseForm } from "@/components/lab/case-form";

export default async function NewCasePage() {
  const tenant = await getTenantFromRequest();
  const t = await getTranslations("cases");

  const doctors = await prisma.doctor.findMany({
    where: { tenantId: tenant.id },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("newCase")}</h1>
      <CaseForm
        doctors={doctors.map((d) => ({ id: d.id, name: d.user.name }))}
      />
    </div>
  );
}
