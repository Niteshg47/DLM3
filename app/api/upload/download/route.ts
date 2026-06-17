import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDownloadPresignedUrl } from "@/lib/s3";

/**
 * GET /api/upload/download?key=<s3Key>
 *
 * Generates a fresh 1-hour presigned download URL for the given S3 key and
 * redirects the browser to it. This avoids baking expiring URLs into HTML at
 * render time; instead the URL is always fresh when the user clicks Download.
 *
 * Security: user must be authenticated; the tenantId segment in the key is
 * verified to match the caller's tenant.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  // Security: the first path segment of the key must match the caller's tenantId
  const keyTenantId = key.split("/")[0];
  if (keyTenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const s3Bucket = process.env.S3_BUCKET;
  const s3Region = process.env.S3_REGION;
  if (!s3Bucket || !s3Region) {
    return NextResponse.json(
      { error: "Server misconfiguration: S3_BUCKET or S3_REGION is not set." },
      { status: 500 }
    );
  }

  try {
    const url = await getDownloadPresignedUrl(key);
    if (!url) {
      return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 });
    }
    // Redirect browser directly to the presigned S3 URL
    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error("[S3 Download]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
