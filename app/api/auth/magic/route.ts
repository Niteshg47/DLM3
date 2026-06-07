import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const tenantId = req.nextUrl.searchParams.get("tenant");

  if (!token || !tenantId) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }

  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
  });

  if (
    !record ||
    record.tenantId !== tenantId ||
    record.expires < new Date()
  ) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId, email: record.email },
    },
  });

  if (!user || !user.active) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }

  await signIn("credentials", {
    email: user.email,
    magicToken: token,
    tenantId,
    redirectTo: user.role === "DOCTOR" ? "/doctor/portal" : "/dashboard",
  });
}
