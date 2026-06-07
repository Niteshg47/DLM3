import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/edge";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dentallab.app";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.DEV_TENANT_SLUG ?? "demo";
  }

  const rootHost = ROOT_DOMAIN.split(":")[0].toLowerCase();

  if (hostname === rootHost || hostname === `www.${rootHost}`) {
    return process.env.DEV_TENANT_SLUG ?? "demo";
  }

  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const slug = hostname.replace(`.${APP_DOMAIN}`, "");
    if (slug && slug !== "www") return slug;
  }

  if (hostname.endsWith(`.${rootHost}`)) {
    const slug = hostname.replace(`.${rootHost}`, "");
    if (slug && slug !== "www") return slug;
  }

  // For Vercel deployment (dlm-3.vercel.app) or any other domain,
  // fall back to demo tenant
  return process.env.DEV_TENANT_SLUG ?? "demo";
}

const publicPaths = ["/login", "/api/auth", "/api/health"];

function isPublicPath(pathname: string) {
  return publicPaths.some((p) => pathname.startsWith(p));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const tenantSlug = extractSubdomain(host);

  const requestHeaders = new Headers(req.headers);
  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }

  if (!tenantSlug && !pathname.startsWith("/api/health")) {
    return NextResponse.redirect(new URL("https://dlm-3.vercel.app", req.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const session = req.auth;
  const isDoctorRoute = pathname.startsWith("/doctor");
  const isLabRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/cases") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.role === "DOCTOR") {
    if (isLabRoute) {
      return NextResponse.redirect(new URL("/doctor/portal", req.url));
    }
  } else if (isDoctorRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (tenantSlug && session.user.tenantId) {
    // Tenant slug validation happens in layouts via DB lookup
  }

  if (pathname === "/") {
    if (session.user.role === "DOCTOR") {
      return NextResponse.redirect(new URL("/doctor/portal", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
