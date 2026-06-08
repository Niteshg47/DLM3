import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      tenantId: string;
      language: string;
    };
  }

  interface User {
    role: UserRole;
    tenantId: string;
    language: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
    tenantId: string;
    language: string;
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantId: { label: "Tenant", type: "text" },
        magicToken: { label: "Magic Token", type: "text" },
        otpVerified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.tenantId) {
          return null;
        }

        const tenantId = credentials.tenantId as string;
        const email = (credentials.email as string).toLowerCase();

        if (credentials.magicToken) {
          const record = await prisma.magicLinkToken.findUnique({
            where: { token: credentials.magicToken as string },
          });

          if (
            !record ||
            record.tenantId !== tenantId ||
            record.email !== email ||
            record.expires < new Date()
          ) {
            return null;
          }

          await prisma.magicLinkToken.delete({ where: { token: record.token } });
        } else if (credentials.otpVerified) {
          // OTP already verified, skip password check
        } else {
          if (!credentials.password) return null;

          const userWithPassword = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email } },
          });

          if (!userWithPassword?.passwordHash) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            userWithPassword.passwordHash
          );

          if (!valid) return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            tenantId_email: { tenantId, email },
          },
        });

        if (!user || !user.active) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          language: user.language,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.language = user.language;
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
};
