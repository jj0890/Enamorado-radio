import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import path from "path";
import crypto from "crypto";

const accountId  = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const bucketName = process.env.R2_BUCKET_NAME ?? "enamorado-radio";
const publicBase = process.env.R2_PUBLIC_URL ?? `https://${bucketName}.${accountId}.r2.dev`;

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export function isR2Configured(): boolean {
  return !!(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

interface UploadOptions {
  folder: string;          // e.g. "editorial", "avatars", "magazine"
  filename?: string;       // override generated name
  contentType: string;
}

export async function uploadToR2(
  buffer: Buffer | Readable,
  options: UploadOptions
): Promise<string> {
  const ext      = options.contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const key      = options.filename
    ? `${options.folder}/${options.filename}`
    : `${options.folder}/${crypto.randomBytes(12).toString("hex")}.${ext}`;

  const upload = new Upload({
    client: r2,
    params: {
      Bucket:      bucketName,
      Key:         key,
      Body:        buffer,
      ContentType: options.contentType,
    },
  });

  await upload.done();
  return `${publicBase}/${key}`;
}

export async function deleteFromR2(urlOrKey: string): Promise<void> {
  // Accept either a full URL or a bare key
  const key = urlOrKey.startsWith("http")
    ? urlOrKey.replace(`${publicBase}/`, "")
    : urlOrKey;

  await r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}
