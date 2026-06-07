"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, magicLinkSchema } from "@/lib/validations/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/ratelimit";
import { randomBytes } from "crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(
  tenantId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "invalid_credentials" };
  }

  const allowed = await checkAuthRateLimit(parsed.data.email);
  if (!allowed) {
    return { error: "rate_limited" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      tenantId,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "invalid_credentials" };
    }
    throw e;
  }

  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: parsed.data.email.toLowerCase(),
      },
    },
  });

  if (user?.role === "DOCTOR") {
    redirect("/doctor/portal");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (tenant && !tenant.onboardingDone && user?.role === "ADMIN") {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function magicLinkAction(
  tenantId: string,
  labName: string,
  formData: FormData
): Promise<{ error?: string; sent?: boolean }> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "invalid_email" };
  }

  const email = parsed.data.email.toLowerCase();
  const allowed = await checkAuthRateLimit(email);
  if (!allowed) {
    return { error: "rate_limited" };
  }

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  });

  if (!user || !user.active) {
    return { sent: true };
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.magicLinkToken.deleteMany({ where: { email, tenantId } });
  await prisma.magicLinkToken.create({
    data: { email, tenantId, token, expires },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/api/auth/magic?token=${token}&tenant=${tenantId}`;

  await sendMagicLinkEmail({ to: email, url, labName });

  return { sent: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
