import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUploadPresignedUrl } from "@/lib/s3";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  // Validate S3 configuration before doing any work
  const s3Bucket = process.env.S3_BUCKET;
  const s3Region = process.env.S3_REGION;
  if (!s3Bucket || !s3Region) {
    console.error("[S3 Presign] Missing env vars — S3_BUCKET:", s3Bucket, "S3_REGION:", s3Region);
    return NextResponse.json(
      { error: "Server misconfiguration: S3_BUCKET or S3_REGION is not set." },
      { status: 500 }
    );
  }

  try {
    const { filename, mimeType, size, caseId = "pending" } = await request.json();

    if (!filename || !mimeType) {
      return NextResponse.json(
        { error: "Missing filename or mimeType" },
        { status: 400 }
      );
    }

    // Size validation (Max 10MB)
    if (size && size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // Type validation: only PDF, JPG, PNG, DICOM, and scanner files (STL, OBJ, PLY) allowed
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/dicom",
      "image/dicom",
      "model/stl",
      "application/sla",
      "model/obj",
      "model/ply",
      "application/octet-stream",
    ];
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "dcm", "stl", "obj", "ply"];
    const ext = filename.split(".").pop()?.toLowerCase();

    const isValidMime = allowedMimeTypes.includes(mimeType);
    const isValidExt = allowedExtensions.includes(ext ?? "");

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPG, PNG, DICOM, and scanner files (STL, OBJ, PLY) allowed." },
        { status: 400 }
      );
    }

    // Generate unique S3 key
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const s3Key = `${tenantId}/${caseId}/${Date.now()}-${safeFilename}`;

    console.log("[S3 Presign] bucket:", s3Bucket, "| key:", s3Key);

    // Get presigned PUT URL
    const { url } = await getUploadPresignedUrl(s3Key, mimeType);

    if (!url) {
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      presignedUrl: url,
      s3Key,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
