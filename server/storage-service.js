import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

const region = process.env.AWS_REGION || "auto";
const bucketName = process.env.AWS_S3_BUCKET;

// For Cloudflare R2, the endpoint is typically: https://<account_id>.r2.cloudflarestorage.com
const endpoint = process.env.AWS_S3_ENDPOINT;

// Detect if cloud storage is configured
const isCloudConfigured = Boolean(bucketName && endpoint && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

let s3Client = null;
if (isCloudConfigured) {
  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log(`✓ Cloud storage configured (bucket: ${bucketName})`);
} else {
  console.log('⚠ Cloud storage NOT configured — using local uploads/ folder (dev mode)');
  // Ensure uploads directory exists for local dev
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export const uploadFile = async (fileBuffer, fileName, mimeType) => {
  if (isCloudConfigured) {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      },
    });

    await upload.done();

    const publicUrl = process.env.STORAGE_PUBLIC_URL
      ? `${process.env.STORAGE_PUBLIC_URL}/${fileName}`
      : `${endpoint}/${bucketName}/${fileName}`;

    return { key: fileName, url: publicUrl };
  }

  // Local fallback for development
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, fileBuffer);
  return { key: fileName, url: `/uploads/${fileName}` };
};

export const deleteFile = async (fileName) => {
  if (!fileName) return;

  if (isCloudConfigured) {
    if (!bucketName) return;
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    await s3Client.send(command);
  } else {
    // Local fallback
    const filePath = path.join(uploadsDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

export const getFileStream = async (fileName) => {
  if (isCloudConfigured) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const { Body } = await s3Client.send(command);
    return Body;
  }

  // Local fallback
  const filePath = path.join(uploadsDir, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${fileName}`);
  }
  return fs.createReadStream(filePath);
};
