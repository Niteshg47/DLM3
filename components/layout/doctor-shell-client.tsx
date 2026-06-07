"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LayoutList, PlusCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function DoctorShellClient({
  tenantName,
  tenantLogo,
  userName,
  userId,
  notifications,
  unreadCount,
  children,
}: {
  tenantName: string;
  tenantLogo?: string | null;
  userName: string;
  userId: string;
  notifications: {
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/doctor/portal", label: "My cases", icon: LayoutList },
    { href: "/doctor/submit", label: "Submit case", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-brand-canvas">
      <header className="bg-white border-b border-sky-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenantLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenantLogo} alt={tenantName} className="h-8" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-brand-sky text-white flex items-center justify-center font-bold">
                {tenantName[0]}
              </div>
            )}
            <div>
              <p className="font-semibold text-sky-900">{tenantName}</p>
              <p className="text-xs text-sky-600">Doctor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-sky-700">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <TopBar
        tenantName={tenantName}
        userName={userName}
        userId={userId}
        notifications={notifications}
        unreadCount={unreadCount}
        theme="doctor"
      />

      <nav className="md:hidden flex border-b border-sky-100 bg-white">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex-1 flex flex-col items-center py-2 text-xs font-medium",
                active ? "text-brand-sky border-b-2 border-brand-sky" : "text-slate-500"
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:flex max-w-5xl mx-auto w-full px-4 pt-4 gap-2">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-brand-sky text-white shadow-sm"
                  : "bg-white text-sky-700 hover:bg-sky-50"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}
