import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  borderClass = "gradient-border-top-indigo",
  iconBg = "bg-indigo-100 text-indigo-600",
}: {
  title: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  borderClass?: string;
  iconBg?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-5 shadow-card transition-all duration-200 hover:shadow-md",
        borderClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-teal-600 font-medium mt-1">{trend}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-3", iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
