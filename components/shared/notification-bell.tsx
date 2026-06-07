"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCheck, FileText, Receipt, FolderOpen, ListTodo } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  CASE_STATUS: FolderOpen,
  INVOICE_SENT: Receipt,
  TASK_ASSIGNED: ListTodo,
  default: FileText,
};

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function NotificationBell({
  userId,
  initialNotifications,
  initialUnread,
}: {
  userId: string;
  initialNotifications: {
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[];
  initialUnread: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [pending, startTransition] = useTransition();

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    });
  }

  function handleMarkOne(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnread((c) => Math.max(0, c - 1));
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={pending}
                  className="text-xs text-brand-indigo font-medium flex items-center gap-1 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </li>
              ) : (
                items.map((n) => {
                  const Icon = typeIcons[n.type] ?? typeIcons.default;
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors",
                        !n.read && "bg-indigo-50/50"
                      )}
                      onClick={() => !n.read && handleMarkOne(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5 rounded-lg bg-indigo-100 p-1.5">
                          <Icon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
