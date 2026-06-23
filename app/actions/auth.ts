"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, magicLinkSchema } from "@/lib/validations/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/ratelimit";
import { generateAndStoreOtp, sendOtpEmail } from "@/lib/otp";
import { randomBytes } from "crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(
  tenantId: string,
  formData: FormData
): Promise<{ error?: string; requiresOtp?: boolean; userId?: string; email?: string; otp?: string }> {
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

  const email = parsed.data.email.toLowerCase();

  // Check if user exists and get their role before signing in
  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId, email },
    },
  });

  if (!user || !user.active) {
    return { error: "invalid_credentials" };
  }

  // Verify password
  const bcrypt = require("bcryptjs");
  if (!user.passwordHash) {
    return { error: "invalid_credentials" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "invalid_credentials" };
  }

  // If user is ADMIN or SUPER_ADMIN, generate and send OTP
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    const otp = await generateAndStoreOtp(tenantId, user.id, email);
    await sendOtpEmail(email, otp);
    
    return {
      requiresOtp: true,
      userId: user.id,
      email: email,
      otp: otp, // Return OTP to display in UI for now
    };
  }

  // For non-ADMIN users, proceed with normal login
  try {
    await signIn("credentials", {
      email,
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

  if (user.role === "DOCTOR") {
    redirect("/doctor/portal");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (tenant && !tenant.onboardingDone) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function verifyOtpAction(
  tenantId: string,
  userId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const otp = formData.get("otp") as string;
  
  if (!otp || otp.length !== 6) {
    return { error: "invalid_otp" };
  }

  const { verifyOtp } = await import("@/lib/otp");
  const isValid = await verifyOtp(tenantId, userId, otp);

  if (!isValid) {
    return { error: "invalid_otp" };
  }

  // Get user email for sign in
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: "invalid_otp" };
  }

  // Sign in the user (OTP already verified)
  try {
    await signIn("credentials", {
      email: user.email,
      password: "", // Not needed when OTP is verified
      tenantId,
      otpVerified: "true", // Bypass password check since OTP was verified
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "invalid_otp" };
    }
    throw e;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (tenant && !tenant.onboardingDone) {
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
