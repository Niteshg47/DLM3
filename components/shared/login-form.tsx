"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { loginAction, magicLinkAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  tenantId,
  labName,
  error,
}: {
  tenantId: string;
  labName: string;
  error?: string;
}) {
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(tenantId, formData);
      if (result?.error) {
        setMessage(t("invalidCredentials"));
      }
    });
  }

  function handleMagic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await magicLinkAction(tenantId, labName, formData);
      if (result?.error === "rate_limited") {
        setMessage("Too many attempts. Please try again later.");
      } else {
        setMessage(t("magicLinkSent"));
      }
    });
  }

  return (
    <div className="space-y-4">
        {(error || message) && (
          <p
            className={`text-sm ${message?.includes("Check") ? "text-emerald-600" : "text-destructive"}`}
            role="alert"
          >
            {error === "expired"
              ? "Magic link expired. Request a new one."
              : message ?? (error ? t("invalidCredentials") : null)}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "password" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("password")}
          >
            Password
          </Button>
          <Button
            type="button"
            variant={mode === "magic" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("magic")}
          >
            {t("magicLink")}
          </Button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@clinic.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-brand-indigo hover:bg-indigo-600"
              disabled={pending}
            >
              {t("login")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMagic} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">{t("email")}</Label>
              <Input
                id="magic-email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-brand-indigo hover:bg-indigo-600"
              disabled={pending}
            >
              {t("magicLink")}
            </Button>
          </form>
        )}
    </div>
  );
}
