import NextAuth from "next-auth";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireLabRole() {
  const session = await requireSession();
  if (session.user.role === "DOCTOR") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireDoctorRole() {
  const session = await requireSession();
  if (session.user.role !== "DOCTOR") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireAdminRole() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
