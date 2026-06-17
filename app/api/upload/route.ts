import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, getSignedUrl, deleteFile } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

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
    console.error("[S3 Upload] Missing env vars — S3_BUCKET:", s3Bucket, "S3_REGION:", s3Region);
    return NextResponse.json(
      { error: "Server misconfiguration: S3_BUCKET or S3_REGION is not set." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size validation (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
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
    const ext = file.name.split(".").pop()?.toLowerCase();

    const isValidMime = allowedMimeTypes.includes(file.type);
    const isValidExt = allowedExtensions.includes(ext ?? "");

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPG, PNG, and DICOM allowed." },
        { status: 400 }
      );
    }

    // Generate unique S3 key
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const s3Key = `${tenantId}/${caseId || "pending"}/${Date.now()}-${safeFilename}`;

    console.log("[S3 Upload] bucket:", s3Bucket, "| key:", s3Key);

    // Read file into Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await uploadFile(buffer, s3Key, tenantId);

    // If caseId is provided and is not "pending", store file metadata in database CaseFile
    let dbRecord = null;
    if (caseId && caseId !== "pending") {
      dbRecord = await prisma.caseFile.create({
        data: {
          caseId,
          tenantId,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          s3Key,
          uploadedBy: session.user.id,
        },
      });
    }

    const signedUrl = await getSignedUrl(s3Key);

    return NextResponse.json({
      success: true,
      s3Key,
      signedUrl,
      file: dbRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get("key");

    if (!s3Key) {
      return NextResponse.json({ error: "No key provided" }, { status: 400 });
    }

    // Security: Check that the tenantId in the key matches the user's tenantId
    const keyParts = s3Key.split("/");
    const keyTenantId = keyParts[0];
    if (keyTenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from S3
    await deleteFile(s3Key);

    // Delete from DB if there's an associated CaseFile record
    await prisma.caseFile.deleteMany({
      where: {
        s3Key,
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
