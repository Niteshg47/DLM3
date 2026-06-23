"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { onboardingSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function completeOnboardingAction(formData: FormData) {
  const session = await requireAdminRole();
  const tenant = await requireTenant();

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    brandColor: formData.get("brandColor"),
    themeSlug: formData.get("themeSlug"),
    logoUrl: formData.get("logoUrl") || null,
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
      onboardingDone: true,
    },
  });

  await logAudit({
    tenantId: tenant.id,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Tenant",
    entityId: tenant.id,
    meta: { onboarding: true },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
