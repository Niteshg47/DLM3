import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import type { Tenant } from "@prisma/client";

export async function getTenantFromRequest(): Promise<Tenant> {
  // The authenticated user's own tenantId is the source of truth — check
  // it FIRST. On the live production domain (a flat URL like
  // dlm-3.vercel.app with no real subdomains), the x-tenant-slug header
  // set by middleware always falls back to one hardcoded value for every
  // visitor, so resolving it first (as before) silently showed every
  // logged-in user the same tenant's data regardless of which tenant they
  // actually belong to.
  const session = await auth();
  if (session?.user?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    });

    if (tenant) {
      return tenant;
    }
  }

  // Fall back to subdomain-based resolution for unauthenticated/public
  // contexts on a deployment with real subdomains configured.
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");

  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (tenant) {
      return tenant;
    }
  }

  throw new Error("Tenant context is unavailable for this request.");
}
