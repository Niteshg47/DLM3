import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
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

  return process.env.DEV_TENANT_SLUG ?? "demo";
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const slug = extractSubdomain(host);
  if (!slug) return null;
  return getTenantBySlug(slug);
}

export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenantFromHeaders();
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }
  return tenant;
}
