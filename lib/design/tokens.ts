/** Design system tokens — Phase 2 UI */
export const colors = {
  primary: "#6366F1",
  sidebar: "#1E1B4B",
  background: "#F8FAFC",
  teal: "#0D9488",
  amber: "#F59E0B",
  rose: "#F43F5E",
  sky: "#0EA5E9",
  purple: "#8B5CF6",
} as const;

export const caseStatusStyles: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  RECEIVED: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  IN_PROGRESS: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  QC_HOLD: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  READY: { bg: "bg-teal-100", text: "text-teal-800", dot: "bg-teal-500" },
  DELIVERED: { bg: "bg-teal-100", text: "text-teal-900", dot: "bg-teal-600" },
  INVOICED: { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
};

export const invoiceStatusStyles: Record<
  string,
  { bg: string; text: string }
> = {
  DRAFT: { bg: "bg-slate-100", text: "text-slate-700" },
  SENT: { bg: "bg-sky-100", text: "text-sky-800" },
  PAID: { bg: "bg-teal-100", text: "text-teal-800" },
  OVERDUE: { bg: "bg-rose-100", text: "text-rose-800" },
};

export const caseTypeChartColors: Record<string, string> = {
  CROWN: "#6366F1",
  BRIDGE: "#0D9488",
  DENTURE: "#F59E0B",
  IMPLANT: "#F43F5E",
  ALIGNER: "#0EA5E9",
  OTHER: "#94A3B8",
};
