import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const illustrations = {
  cases: (
    <svg className="w-24 h-24 text-indigo-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" fillOpacity="0.3"/>
      <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
      <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" fill="currentColor"/>
    </svg>
  ),
  invoices: (
    <svg className="w-24 h-24 text-purple-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" fillOpacity="0.2"/>
      <rect x="6" y="8" width="8" height="2" rx="1" fill="currentColor"/>
      <rect x="6" y="12" width="12" height="2" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <rect x="6" y="16" width="10" height="2" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <circle cx="17" cy="9" r="2" fill="currentColor"/>
    </svg>
  ),
  analytics: (
    <svg className="w-24 h-24 text-teal-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="13" width="4" height="8" rx="1" fill="currentColor" fillOpacity="0.4"/>
      <rect x="10" y="9" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <rect x="17" y="5" width="4" height="16" rx="1" fill="currentColor"/>
      <path d="M2 21H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  tasks: (
    <svg className="w-24 h-24 text-amber-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" fillOpacity="0.3"/>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  default: (
    <svg className="w-24 h-24 text-slate-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" fillOpacity="0.2"/>
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

export function EmptyState({
  illustration = "default",
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: {
  illustration?: keyof typeof illustrations;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  const Illustration = illustrations[illustration] || illustrations.default;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-card",
        className
      )}
    >
      <div className="mb-4" role="img" aria-hidden>
        {Illustration}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Button asChild className="mt-6 bg-brand-indigo hover:bg-indigo-600 transition-all duration-200">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
