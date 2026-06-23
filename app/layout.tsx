import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { getThemeCssVars } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Dental Lab Portal",
  description: "Multi-tenant dental lab case management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  let themeVars = getThemeCssVars("OCEAN_TEAL");
  try {
    const tenant = await getTenantFromRequest();
    themeVars = getThemeCssVars(tenant.themeSlug as any);
  } catch (err) {
    console.error("[RootLayout] failed to resolve tenant theme:", err);
  }
  const themeStyle = themeVars as CSSProperties;

  return (
    <html lang={locale}>
      <body className={inter.className} style={themeStyle}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
