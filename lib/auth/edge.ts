import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

const edgeConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.tenantId = (user as { tenantId: string }).tenantId;
        token.language = (user as { language: string }).language;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId as string;
        session.user.language = (token.language as string) ?? "en";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { auth } = NextAuth({
  ...edgeConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
