"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/shared/notification-bell";
import { AvatarInitials } from "@/components/shared/avatar-initials";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/cases": "Cases",
  "/tasks": "Tasks",
  "/billing": "Billing",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/doctor/portal": "My cases",
  "/doctor/submit": "Submit case",
};

function resolveTitle(pathname: string) {
  for (const [path, title] of Object.entries(titles)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) return title;
  }
  if (pathname.includes("/cases/new")) return "New case";
  if (pathname.includes("/billing/new")) return "New invoice";
  return "Portal";
}

export function TopBar({
  tenantName,
  userName,
  userId,
  notifications,
  unreadCount,
  onMenuClick,
  showMenu,
  theme = "lab",
}: {
  tenantName: string;
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
  onMenuClick?: () => void;
  showMenu?: boolean;
  theme?: "lab" | "doctor";
}) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header
      className={
        theme === "doctor"
          ? "sticky top-0 z-20 bg-white border-b border-sky-100 shadow-sm"
          : "sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm"
      }
    >
      <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          {showMenu && (
            <button
              type="button"
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{title}</h2>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{tenantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell
            userId={userId}
            initialNotifications={notifications}
            initialUnread={unreadCount}
          />
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <AvatarInitials name={userName} size="sm" />
            <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
              {userName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
