import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import type { Tenant } from "@prisma/client";

export async function getTenantFromRequest(): Promise<Tenant> {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");

  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (tenant) {
      return tenant;
    }
  }

  const session = await auth();
  if (session?.user?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    });

    if (tenant) {
      return tenant;
    }
  }

  throw new Error("Tenant context is unavailable for this request.");
}
