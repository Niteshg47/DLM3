"use client";

import { useTransition, useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  doctorSubmitCaseSchema,
  type DoctorSubmitCaseInput,
} from "@/lib/validations/case";
import { doctorSubmitCaseAction } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip, Trash2, CloudUpload } from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  mimeType: string;
  s3Key: string;
}
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

export function DoctorCaseForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DoctorSubmitCaseInput>({
    resolver: zodResolver(doctorSubmitCaseSchema),
    defaultValues: { priority: "NORMAL", units: 1 },
  });

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    setErrorMsg(null);
    setUploading(true);

    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          caseId: "pending",
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Failed to generate upload URL");
      }

      const { presignedUrl, s3Key } = presignData;

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to S3");
      }

      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        s3Key,
      };
      setUploadedFiles((prev) => [...prev, newFile]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (s3Key: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/upload?key=${encodeURIComponent(s3Key)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete file from S3");
      }
      setUploadedFiles((prev) => prev.filter((f) => f.s3Key !== s3Key));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to remove file");
    }
  };

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

          {/* File Upload Section */}
          <div className="space-y-2 pt-2">
            <Label>Attachments (X-rays, Prescriptions, Scanner files)</Label>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs flex justify-between items-center">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-red-900 font-bold"
                >
                  &times;
                </button>
              </div>
            )}

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                dragActive
                  ? "border-brand-indigo bg-indigo-50/50"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.dcm,.stl,.obj,.ply"
                onChange={handleChange}
                disabled={uploading}
              />
              <div className="flex flex-col items-center justify-center gap-1">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                ) : (
                  <CloudUpload className="h-5 w-5 text-slate-400" />
                )}
                <p className="text-xs font-medium text-slate-700 mt-1">
                  {uploading ? "Uploading..." : "Drag & drop files, or click to browse"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Supports PDF, JPG, PNG, DICOM, STL, OBJ, PLY (Max 10MB)
                </p>
                {!uploading && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 bg-white h-7 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                )}
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto mt-2 border border-slate-100 rounded-md p-2">
                {uploadedFiles.map((file) => (
                  <div key={file.s3Key} className="py-2 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemove(file.s3Key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={pending || uploading}
              className="w-1/3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || uploading}
              className="w-2/3"
            >
              Submit case
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
