"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AvatarInitials } from "@/components/shared/avatar-initials";
import { formatCurrency } from "@/lib/utils";
import { caseTypeChartColors } from "@/lib/design/tokens";
import { FolderOpen, IndianRupee, Clock, Users } from "lucide-react";

type AnalyticsData = {
  summary: {
    totalCases: number;
    totalRevenue: number;
    avgTurnaround: number;
    activeDoctors: number;
  };
  casesByDay: { date: string; count: number }[];
  revenueByDay: { date: string; amount: number }[];
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  topDoctors: { name: string; count: number }[];
  staffProductivity: {
    name: string;
    assigned: number;
    completed: number;
    percent: number;
  }[];
  hasData: boolean;
};

export function AnalyticsDashboard() {
  const [range, setRange] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (range === "custom" && customFrom && customTo) {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    fetch(`/api/analytics/summary?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range, customFrom, customTo]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-slate-200" />
          <div className="h-64 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <EmptyState
        illustration="analytics"
        title="No data yet"
        description="Once you start receiving cases, your analytics will appear here."
        actionLabel="View cases"
        actionHref="/cases"
      />
    );
  }

  const maxDoctorCount = Math.max(...data.topDoctors.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(["7d", "30d", "90d", "custom"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              range === r
                ? "bg-brand-indigo text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {r === "7d"
              ? "7 days"
              : r === "30d"
                ? "30 days"
                : r === "90d"
                  ? "90 days"
                  : "Custom"}
          </button>
        ))}
        {range === "custom" && (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border px-2 py-1 text-sm"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border px-2 py-1 text-sm"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total cases"
          value={data.summary.totalCases}
          icon={FolderOpen}
          trend="+12% vs last period"
        />
        <StatCard
          title="Total revenue"
          value={formatCurrency(data.summary.totalRevenue)}
          icon={IndianRupee}
          borderClass="gradient-border-top-purple"
          iconBg="bg-purple-100 text-brand-purple"
        />
        <StatCard
          title="Avg turnaround"
          value={`${data.summary.avgTurnaround} days`}
          icon={Clock}
          borderClass="gradient-border-top-amber"
          iconBg="bg-amber-100 text-brand-amber"
        />
        <StatCard
          title="Active doctors"
          value={data.summary.activeDoctors}
          icon={Users}
          borderClass="gradient-border-top-teal"
          iconBg="bg-teal-100 text-brand-teal"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Cases over time">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.casesByDay}>
              <defs>
                <linearGradient id="indigoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366F1"
                fill="url(#indigoFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue over time">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cases by type">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.byType.filter((d) => d.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.byType.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={caseTypeChartColors[entry.name] ?? "#94A3B8"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline by status">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.byStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Top doctors by volume">
          <ul className="space-y-4">
            {data.topDoctors.map((d) => (
              <li key={d.name} className="flex items-center gap-3">
                <AvatarInitials name={d.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{d.name}</span>
                    <span className="text-muted-foreground">{d.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-indigo rounded-full transition-all duration-200"
                      style={{ width: `${(d.count / maxDoctorCount) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Staff productivity">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Staff</th>
                <th className="pb-2 text-right">Assigned</th>
                <th className="pb-2 text-right">Done</th>
                <th className="pb-2 w-24">Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.staffProductivity.map((s, i) => (
                <tr key={s.name} className={i % 2 === 1 ? "bg-brand-canvas" : ""}>
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2 text-right">{s.assigned}</td>
                  <td className="py-2 text-right">{s.completed}</td>
                  <td className="py-2">
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full bg-brand-teal rounded-full"
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-card transition-all duration-200 hover:shadow-md">
      <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}
