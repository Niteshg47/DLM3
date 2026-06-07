"use client";

import { useTransition } from "react";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function OnboardingForm({
  defaultName,
  defaultColor,
}: {
  defaultName: string;
  defaultColor: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await completeOnboardingAction(formData);
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Lab name</Label>
            <Input id="name" name="name" defaultValue={defaultName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandColorPicker">Brand color</Label>
            <div className="flex gap-2 items-center">
              <input
                id="brandColorPicker"
                type="color"
                defaultValue={defaultColor}
                className="h-10 w-14 cursor-pointer rounded border"
                onChange={(e) => {
                  const hex = document.getElementById("brandColor") as HTMLInputElement;
                  if (hex) hex.value = e.target.value;
                }}
              />
              <Input id="brandColor" name="brandColor" defaultValue={defaultColor} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL (optional)</Label>
            <Input id="logoUrl" name="logoUrl" type="url" placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            Complete setup
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
