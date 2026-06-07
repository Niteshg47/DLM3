"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { TopBar } from "@/components/layout/top-bar";
import { AvatarInitials } from "@/components/shared/avatar-initials";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "bg-indigo-500" },
  { href: "/cases", label: "Cases", icon: FolderOpen, badge: "bg-sky-500" },
  { href: "/tasks", label: "Tasks", icon: ListTodo, badge: "bg-amber-500" },
  { href: "/billing", label: "Billing", icon: Receipt, badge: "bg-purple-500" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, badge: "bg-teal-500", adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, badge: "bg-slate-500" },
];

const mobileNav = navItems.filter((n) => !n.adminOnly).slice(0, 5);

export function LabShellClient({
  tenantName,
  tenantLogo,
  userName,
  userRole,
  userId,
  isAdmin,
  children,
  notifications,
  unreadCount,
}: {
  tenantName: string;
  tenantLogo?: string | null;
  userName: string;
  userRole: string;
  userId: string;
  isAdmin: boolean;
  children: React.ReactNode;
  notifications: {
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[];
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = navItems.filter((n) => !n.adminOnly || isAdmin);

  const NavLinks = ({ mobile }: { mobile?: boolean }) => (
    <>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              active
                ? "bg-indigo-500/20 text-white border-l-4 border-indigo-400 -ml-0.5 pl-[calc(0.75rem-4px)]"
                : "text-indigo-100/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.badge)}>
              <Icon className="h-4 w-4 text-white" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex bg-brand-canvas">
      {/* Desktop sidebar */}
      <aside className="no-print hidden md:flex w-[240px] flex-col bg-brand-sidebar text-white shrink-0 fixed inset-y-0 left-0 z-40">
        <div className="p-4 border-b border-white/10">
          {tenantLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenantLogo} alt={tenantName} className="h-9 mb-2 object-contain" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-indigo-500 flex items-center justify-center text-lg font-bold mb-2">
              {tenantName[0]}
            </div>
          )}
          <p className="font-semibold text-sm truncate">{tenantName}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <AvatarInitials name={userName} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-indigo-200/70 capitalize">{userRole.replace("_", " ").toLowerCase()}</p>
            </div>
          </div>
          <LanguageSwitcher variant="dark" />
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-indigo-100 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] bg-brand-sidebar text-white flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-white/10">
              <span className="font-semibold">{tenantName}</span>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <NavLinks mobile />
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen">
        <TopBar
          tenantName={tenantName}
          userName={userName}
          userId={userId}
          notifications={notifications}
          unreadCount={unreadCount}
          onMenuClick={() => setSidebarOpen(true)}
          showMenu
        />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-[1280px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden no-print fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 safe-area-pb">
        <div className="flex justify-around py-2">
          {mobileNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-brand-indigo" : "text-slate-500"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-slate-500"
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}
