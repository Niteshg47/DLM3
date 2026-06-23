import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Tenant } from "@prisma/client";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dentallab.app";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.DEV_TENANT_SLUG ?? "demo";
  }

  const rootHost = ROOT_DOMAIN.split(":")[0].toLowerCase();

  if (hostname === rootHost || hostname === `www.${rootHost}`) {
    return null;
  }

  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const slug = hostname.replace(`.${APP_DOMAIN}`, "");
    if (slug && slug !== "www") return slug;
  }

  if (hostname.endsWith(`.${rootHost}`)) {
    const slug = hostname.replace(`.${rootHost}`, "");
    if (slug && slug !== "www") return slug;
  }

  return null;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function getTenantBySlugOrDomain(identifier: string): Promise<Tenant | null> {
  return prisma.tenant.findFirst({
    where: {
      OR: [{ slug: identifier }, { customDomain: identifier }],
    },
  });
}

export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const slug = extractSubdomain(host);
  const identifier = slug ?? host.split(":")[0].toLowerCase();
  if (!identifier) return null;
  return getTenantBySlugOrDomain(identifier);
}

export async function requireTenant(): Promise<Tenant> {
  // The authenticated user's own tenantId is the source of truth for any
  // logged-in request. We must check this FIRST: on the live production
  // domain (a flat URL like dlm-3.vercel.app with no real subdomains),
  // extractSubdomain() always falls back to a single hardcoded slug
  // (DEV_TENANT_SLUG / "demo") for every visitor, regardless of which
  // tenant they actually belong to. Relying on that slug here would
  // silently put every authenticated user's writes into the wrong tenant.
  const session = await auth();
  if (session?.user?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    });
    if (tenant) {
      return tenant;
    }
  }

  // Fall back to subdomain-based resolution. This only matters for
  // unauthenticated/public contexts (e.g. tenant-branded marketing or
  // login pages) on a deployment that actually has real subdomains
  // configured.
  const tenant = await getTenantFromHeaders();
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }
  return tenant;
}
