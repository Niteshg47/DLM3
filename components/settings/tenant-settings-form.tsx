"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTenantSettingsAction } from "@/app/actions/tenant-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { THEME_SLUGS, getThemeLabel } from "@/lib/theme";

type FieldErrors = Record<string, string[]>;

export function TenantSettingsForm({
  tenant,
}: {
  tenant: {
    name: string;
    brandColor: string;
    themeSlug: string;
    logoUrl?: string | null;
    gstNumber?: string | null;
    address?: string | null;
    customDomain?: string | null;
    whatsappEnabled: boolean;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function getFieldError(field: string) {
    return fieldErrors[field]?.[0] ?? null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateTenantSettingsAction(formData);

      if (result?.success) {
        router.refresh();
        return;
      }

      if (result?.error) {
        setFormError(result.error.formErrors?.join(" ") ?? "Failed to update settings.");
        setFieldErrors(result.error.fieldErrors ?? {});
        return;
      }

      setFormError("Failed to update settings.");
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Update settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Change lab branding, GST details, custom domain, and WhatsApp preferences.
          </p>
        </div>

        {formError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 mb-4">
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Lab name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={tenant.name}
                required
              />
              {getFieldError("name") ? (
                <p className="text-sm text-rose-600">{getFieldError("name")}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandColorPicker">Brand color</Label>
              <div className="flex gap-2 items-center">
                <input
                  id="brandColorPicker"
                  type="color"
                  defaultValue={tenant.brandColor}
                  className="h-10 w-14 cursor-pointer rounded border"
                  onChange={(e) => {
                    const hexInput = document.getElementById("brandColor") as HTMLInputElement | null;
                    if (hexInput) hexInput.value = e.target.value;
                  }}
                />
                <Input
                  id="brandColor"
                  name="brandColor"
                  defaultValue={tenant.brandColor}
                  type="text"
                  required
                />
              </div>
              {getFieldError("brandColor") ? (
                <p className="text-sm text-rose-600">{getFieldError("brandColor")}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="themeSlug">Theme</Label>
            <select
              id="themeSlug"
              name="themeSlug"
              defaultValue={tenant.themeSlug ?? "OCEAN_TEAL"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
            >
              {THEME_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {getThemeLabel(slug)}
                </option>
              ))}
            </select>
            {getFieldError("themeSlug") ? (
              <p className="text-sm text-rose-600">{getFieldError("themeSlug")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" name="logoUrl" type="url" defaultValue={tenant.logoUrl ?? ""} placeholder="https://..." />
            {getFieldError("logoUrl") ? (
              <p className="text-sm text-rose-600">{getFieldError("logoUrl")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstNumber">GST number</Label>
            <Input id="gstNumber" name="gstNumber" defaultValue={tenant.gstNumber ?? ""} />
            {getFieldError("gstNumber") ? (
              <p className="text-sm text-rose-600">{getFieldError("gstNumber")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={tenant.address ?? ""} />
            {getFieldError("address") ? (
              <p className="text-sm text-rose-600">{getFieldError("address")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom domain</Label>
            <Input id="customDomain" name="customDomain" type="url" defaultValue={tenant.customDomain ?? ""} placeholder="https://example.com" />
            {getFieldError("customDomain") ? (
              <p className="text-sm text-rose-600">{getFieldError("customDomain")}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="whatsappEnabled"
              name="whatsappEnabled"
              type="checkbox"
              defaultChecked={tenant.whatsappEnabled}
              value="true"
              className="h-4 w-4 rounded border-input text-brand-indigo focus:ring-ring"
            />
            <Label htmlFor="whatsappEnabled">Enable WhatsApp notifications</Label>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            Save settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
