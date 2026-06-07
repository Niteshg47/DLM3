import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import type { Tenant } from "@prisma/client";

export async function getTenantFromRequest(): Promise<Tenant> {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");

  if (!slug) {
    notFound();
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    notFound();
  }

  return tenant;
}
