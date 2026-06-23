"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { tenantSettingsSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function updateTenantSettingsAction(formData: FormData) {
  const session = await requireAdminRole();
  const tenant = await requireTenant();

  const customDomainRaw = formData.get("customDomain");
  const customDomain = typeof customDomainRaw === "string" && customDomainRaw.trim() !== "" ? customDomainRaw.trim() : null;

  const parsed = tenantSettingsSchema.safeParse({
    name: formData.get("name"),
    brandColor: formData.get("brandColor"),
    themeSlug: formData.get("themeSlug"),
    logoUrl: formData.get("logoUrl") || null,
    gstNumber: formData.get("gstNumber") || null,
    address: formData.get("address") || null,
    customDomain,
    whatsappEnabled: formData.get("whatsappEnabled") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      name: parsed.data.name,
      brandColor: parsed.data.brandColor,
      themeSlug: parsed.data.themeSlug,
      logoUrl: parsed.data.logoUrl,
      gstNumber: parsed.data.gstNumber,
      address: parsed.data.address,
      customDomain: parsed.data.customDomain,
      whatsappEnabled: parsed.data.whatsappEnabled,
    },
  });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Tenant",
    entityId: tenant.id,
    meta: { settings: true },
  });

  revalidatePath("/settings");
  return { success: true };
}
