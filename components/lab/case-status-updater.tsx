"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CaseStatus } from "@prisma/client";
import { updateCaseStatusAction } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses: CaseStatus[] = [
  "RECEIVED",
  "IN_PROGRESS",
  "QC_HOLD",
  "READY",
  "DELIVERED",
  "INVOICED",
];

export function CaseStatusUpdater({
  caseId,
  currentStatus,
}: {
  caseId: string;
  currentStatus: CaseStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = React.useState<CaseStatus>(currentStatus);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const note = (fd.get("note") as string) || undefined;

    startTransition(async () => {
      await updateCaseStatusAction(caseId, status as CaseStatus, note);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-card border border-indigo-100">
      <h3 className="font-semibold text-slate-800 mb-4">Update status</h3>
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CaseStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <textarea
              id="note"
              name="note"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Add a note with this status change..."
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-brand-indigo hover:bg-indigo-600"
            disabled={pending}
          >
            Update
          </Button>
        </form>
      </div>
    </div>
  );
}
