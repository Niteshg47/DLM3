"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteCaseFileAction } from "@/app/actions/cases";
import { Loader2, Paperclip, Trash2, Download, CloudUpload } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CaseFileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  s3Key: string;
  createdAt: Date | string;
  url?: string;
}

interface CaseAttachmentsProps {
  caseId: string;
  initialFiles: CaseFileItem[];
  isAdmin: boolean;
}

export function CaseAttachments({ caseId, initialFiles, isAdmin }: CaseAttachmentsProps) {
  const [files, setFiles] = useState<CaseFileItem[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      if (data.success && data.file) {
        const newFile: CaseFileItem = {
          ...data.file,
          url: data.signedUrl,
        };
        setFiles((prev) => [newFile, ...prev]);
      } else {
        throw new Error("Upload response was invalid");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong during upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }
    setErrorMsg(null);
    setDeletingId(fileId);

    try {
      const result = await deleteCaseFileAction(fileId);
      if ("error" in result) {
        throw new Error(result.error || "Failed to delete file");
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-indigo-500" />
          Case Attachments (X-rays, Prescriptions, Scanner files)
        </h3>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm flex justify-between items-center">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-900 hover:text-red-950 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
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

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              ) : (
                <CloudUpload className="h-6 w-6 text-slate-500" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 mt-2">
              {uploading ? "Uploading file..." : "Drag & drop files here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, JPG, PNG, DICOM, STL, OBJ, PLY (Max 10MB)
            </p>
            {!uploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 bg-white"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
            )}
          </div>
        </div>

        {/* File Roster */}
        {files.length > 0 ? (
          <div className="mt-6 divide-y divide-slate-100">
            {files.map((file) => (
              <div key={file.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(file.size)} &bull; {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {file.url ? (
                    <Button variant="ghost" size="icon" asChild title="Download">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}>
                        <Download className="h-4 w-4 text-slate-600" />
                      </a>
                    </Button>
                  ) : null}

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      title="Delete"
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground mt-6 py-4">
            No files attached to this case.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
