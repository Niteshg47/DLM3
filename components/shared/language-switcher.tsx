"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/app/actions/locale";

export function LanguageSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function switchLocale(next: "en" | "hi") {
    startTransition(async () => {
      await setLocale(next);
      window.location.reload();
    });
  }

  const active =
    variant === "dark"
      ? "bg-white/20 text-white"
      : "bg-brand-indigo text-white";
  const inactive =
    variant === "dark"
      ? "text-indigo-200 hover:bg-white/10"
      : "text-slate-600 hover:bg-slate-100";

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        className={locale === "en" ? active : inactive}
        onClick={() => switchLocale("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        className={locale === "hi" ? active : inactive}
        onClick={() => switchLocale("hi")}
      >
        HI
      </Button>
    </div>
  );
}
