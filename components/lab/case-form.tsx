"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCaseSchema, type CreateCaseInput } from "@/lib/validations/case";
import { createCaseAction } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const caseTypes = ["CROWN", "BRIDGE", "DENTURE", "IMPLANT", "ALIGNER", "OTHER"] as const;
const priorities = ["NORMAL", "URGENT", "STAT"] as const;

export function CaseForm({
  doctors,
  defaultValues,
  caseId,
}: {
  doctors: { id: string; name: string }[];
  defaultValues?: Partial<CreateCaseInput>;
  caseId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      priority: "NORMAL",
      units: 1,
      ...defaultValues,
    },
  });

  function onSubmit(data: CreateCaseInput) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });

    startTransition(async () => {
      const result = await createCaseAction(fd);
      if (result?.success && result.id) {
        router.push(`/cases/${result.id}`);
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Doctor</Label>
            <Select
              value={form.watch("doctorId")}
              onValueChange={(v) => form.setValue("doctorId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.doctorId && (
              <p className="text-sm text-destructive">Doctor is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientName">Patient name</Label>
            <Input id="patientName" {...form.register("patientName")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientAge">Age</Label>
              <Input id="patientAge" type="number" {...form.register("patientAge")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientGender">Gender</Label>
              <Input id="patientGender" {...form.register("patientGender")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Case type</Label>
              <Select
                value={form.watch("caseType")}
                onValueChange={(v) =>
                  form.setValue("caseType", v as CreateCaseInput["caseType"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {caseTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) =>
                  form.setValue("priority", v as CreateCaseInput["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...form.register("dueDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shade">Shade</Label>
              <Input id="shade" {...form.register("shade")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="units">Units</Label>
            <Input id="units" type="number" min={1} {...form.register("units")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...form.register("notes")}
            />
          </div>

          <Button type="submit" disabled={pending}>
            {caseId ? "Save changes" : "Create case"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
