import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT;

  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: process.env.S3_REGION || "ap-south-1",
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  };

  // Only inject endpoint when it is a fully-qualified URL (http/https).
  // An empty string, a bare hostname, or an undefined value must be ignored —
  // passing an invalid string crashes the AWS SDK with "Invalid URL".
  if (endpoint && endpoint.startsWith("http")) {
    config.endpoint = endpoint;
    config.forcePathStyle = true; // required for MinIO / LocalStack style endpoints
  }

  return new S3Client(config);
}

const bucket = process.env.S3_BUCKET ?? "";

export async function getUploadPresignedUrl(key: string, contentType: string) {
  if (!bucket) {
    console.warn("[S3] S3_BUCKET is not set — returning mock presign.");
    return { url: null, key, mock: true };
  }
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const url = await s3GetSignedUrl(client, command, { expiresIn: 3600 });
  return { url, key };
}

export async function getDownloadPresignedUrl(key: string) {
  if (!bucket) return null;
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return s3GetSignedUrl(client, command, { expiresIn: 3600 });
}

export async function uploadFile(
  file: Buffer | Uint8Array | Blob | string,
  key: string,
  tenantId: string
): Promise<string> {
  if (!bucket) {
    console.warn("[S3] S3_BUCKET is not set — skipping upload.");
    return "";
  }
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
  });
  await client.send(command);

  const endpoint = process.env.S3_ENDPOINT;
  if (endpoint && endpoint.startsWith("http")) {
    return `${endpoint}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${process.env.S3_REGION ?? "ap-south-1"}.amazonaws.com/${key}`;
}

export async function getSignedUrl(key: string): Promise<string> {
  if (!bucket) return "";
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return s3GetSignedUrl(client, command, { expiresIn: 3600 });
}

export async function deleteFile(key: string): Promise<void> {
  if (!bucket) return;
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await client.send(command);
}

export function buildAttachmentKey(tenantId: string, caseId: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `tenants/${tenantId}/cases/${caseId}/${Date.now()}-${safe}`;
}
