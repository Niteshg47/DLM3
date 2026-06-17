"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CloudUpload, Loader2, Paperclip, Trash2 } from "lucide-react";

export interface UploadedFile {
  name: string;
  size: number;
  mimeType: string;
  s3Key: string;
}

interface FileUploadProps {
  /** Called whenever the files list changes (upload or remove). */
  onFilesChange: (files: UploadedFile[]) => void;
  /** Files currently tracked by the parent. */
  value?: UploadedFile[];
  /** Max number of files allowed. Defaults to unlimited. */
  maxFiles?: number;
  /** HTML accept string. Defaults to PDF, image, and scanner formats. */
  accept?: string;
  /** Label rendered above the drop zone. */
  label?: string;
  disabled?: boolean;
}

const DEFAULT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.dcm,.stl,.obj,.ply";
const DEFAULT_LABEL = "Attachments (X-rays, Prescriptions, Scanner files)";

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function FileUpload({
  onFilesChange,
  value = [],
  maxFiles,
  accept = DEFAULT_ACCEPT,
  label = DEFAULT_LABEL,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAdd = maxFiles == null || value.length < maxFiles;

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!canAdd) return;
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await handleUpload(file);
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      await handleUpload(file);
    }
    // Reset so same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Core upload via presigned URL ────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setErrorMsg(null);
    if (!canAdd) {
      setErrorMsg(`Maximum ${maxFiles} file(s) allowed.`);
      return;
    }
    setUploading(true);

    try {
      // 1. Get a presigned PUT URL from our API
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

      const { presignedUrl, s3Key } = presignData as {
        presignedUrl: string;
        s3Key: string;
      };

      // 2. PUT the file directly to S3
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
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

      onFilesChange([...value, newFile]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // ── Remove a file from S3 and the list ───────────────────────────────────
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
      onFilesChange(value.filter((f) => f.s3Key !== s3Key));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to remove file");
    }
  };

  const isDisabled = disabled || uploading;

  return (
    <div className="space-y-2 pt-2">
      <Label>{label}</Label>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs flex justify-between items-center">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive && canAdd && !isDisabled
            ? "border-brand-indigo bg-indigo-50/50"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
        } ${isDisabled || !canAdd ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={maxFiles == null || maxFiles > 1}
          onChange={handleChange}
          disabled={isDisabled || !canAdd}
          id="file-upload-input"
        />
        <div className="flex flex-col items-center justify-center gap-1">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          ) : (
            <CloudUpload className="h-5 w-5 text-slate-400" />
          )}
          <p className="text-xs font-medium text-slate-700 mt-1">
            {uploading
              ? "Uploading..."
              : canAdd
                ? "Drag & drop files, or click to browse"
                : `Maximum ${maxFiles} file(s) reached`}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Supports PDF, JPG, PNG, DICOM, STL, OBJ, PLY (Max 10MB)
          </p>
          {!uploading && canAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 bg-white h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
            >
              Select File
            </Button>
          )}
        </div>
      </div>

      {/* Uploaded files list */}
      {value.length > 0 && (
        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto mt-2 border border-slate-100 rounded-md p-2">
          {value.map((file) => (
            <div
              key={file.s3Key}
              className="py-2 flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span
                  className="truncate font-medium text-slate-700"
                  title={file.name}
                >
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
                disabled={isDisabled}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
