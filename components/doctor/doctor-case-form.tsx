"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  doctorSubmitCaseSchema,
  type DoctorSubmitCaseInput,
} from "@/lib/validations/case";
import { doctorSubmitCaseAction } from "@/app/actions/cases";
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
import { FileUpload, type UploadedFile } from "@/components/shared/FileUpload";

const caseTypes = ["CROWN", "BRIDGE", "DENTURE", "IMPLANT", "ALIGNER", "OTHER"] as const;
const priorities = ["NORMAL", "URGENT", "STAT"] as const;

export function DoctorCaseForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const form = useForm<DoctorSubmitCaseInput>({
    resolver: zodResolver(doctorSubmitCaseSchema),
    defaultValues: { priority: "NORMAL", units: 1 },
  });

  /** Clean up S3 files and navigate away when the user cancels. */
  const handleCancel = async () => {
    if (uploadedFiles.length > 0) {
      try {
        await Promise.all(
          uploadedFiles.map((file) =>
            fetch(`/api/upload?key=${encodeURIComponent(file.s3Key)}`, {
              method: "DELETE",
            })
          )
        );
      } catch (err) {
        console.error("Failed to clean up files on cancel:", err);
      }
    }
    router.push("/doctor/portal");
  };

  function onSubmit(data: DoctorSubmitCaseInput) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    fd.append("uploadedFiles", JSON.stringify(uploadedFiles));

    startTransition(async () => {
      const result = await doctorSubmitCaseAction(fd);
      if (result?.success && result.id) {
        router.push(`/doctor/cases/${result.id}`);
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  form.setValue("caseType", v as DoctorSubmitCaseInput["caseType"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
                  form.setValue("priority", v as DoctorSubmitCaseInput["priority"])
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
              <Label htmlFor="dueDate">Preferred due date</Label>
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
            <Label htmlFor="notes">Notes for lab</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...form.register("notes")}
            />
          </div>

          {/* Reusable file upload */}
          <FileUpload
            value={uploadedFiles}
            onFilesChange={setUploadedFiles}
            disabled={pending}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={pending}
              className="w-1/3"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="w-2/3">
              Submit case
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
