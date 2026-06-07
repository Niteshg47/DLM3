"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { loginAction, magicLinkAction, verifyOtpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/shared/otp-input";

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
  const [otpMode, setOtpMode] = useState(false);
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(tenantId, formData);
      if (result?.error) {
        setMessage(t("invalidCredentials"));
      } else if (result?.requiresOtp) {
        setOtpMode(true);
        setOtpUserId(result.userId || null);
        setOtpEmail(result.email || null);
        setOtpValue(result.otp || null);
        setMessage(`OTP sent to your email: ${result.email}`);
        setResendCooldown(60);
        const cooldownInterval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });
  }

  function handleOtpSubmit(otp: string) {
    const formData = new FormData();
    formData.append("otp", otp);
    startTransition(async () => {
      const result = await verifyOtpAction(tenantId, otpUserId || "", formData);
      if (result?.error) {
        setMessage("Invalid OTP. Please try again.");
      }
    });
  }

  function handleResendOtp() {
    if (resendCooldown > 0 || !otpEmail) return;
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", otpEmail);
      formData.append("password", ""); // Password already verified
      const result = await loginAction(tenantId, formData);
      if (result?.otp) {
        setOtpValue(result.otp);
        setMessage(`New OTP sent to your email: ${result.email}`);
        setResendCooldown(60);
        const cooldownInterval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
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

  if (otpMode) {
    return (
      <div className="space-y-4">
        {message && (
          <p className="text-sm text-emerald-600" role="alert">
            {message}
          </p>
        )}
        {otpValue && (
          <p className="text-sm font-semibold text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            OTP: {otpValue}
          </p>
        )}
        <div className="space-y-4">
          <div className="text-center">
            <Label className="text-base font-medium">Enter the 6-digit OTP</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Check your email for the verification code
            </p>
          </div>
          <OtpInput onComplete={handleOtpSubmit} disabled={pending} />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || pending}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setOtpMode(false)}
            disabled={pending}
          >
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {(error || message) && (
          <p
            className={`text-sm ${message?.includes("Check") || message?.includes("OTP") ? "text-emerald-600" : "text-destructive"}`}
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
