import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = import.meta.env.VITE_R2_BUCKET;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

function isR2Configured() {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export function getR2PublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `https://${R2_ACCOUNT_ID}.r2.dev/${R2_BUCKET}/${key}`;
}

export const r2Storage = {
  isConfigured: isR2Configured,

  async upload(path: string, body: string | Blob, contentType: string): Promise<void> {
    if (!isR2Configured()) {
      throw new Error('R2 is not configured. Set VITE_R2_* environment variables.');
    }

    const client = createR2Client();
    const arrayBuffer = body instanceof Blob ? await body.arrayBuffer() : new TextEncoder().encode(body).buffer;

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: path,
        Body: new Uint8Array(arrayBuffer),
        ContentType: contentType,
      })
    );
  },

  async download(path: string): Promise<Blob | null> {
    if (!isR2Configured()) {
      throw new Error('R2 is not configured. Set VITE_R2_* environment variables.');
    }

    const client = createR2Client();

    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: path,
        })
      );

      if (!response.Body) return null;

      const chunks: Uint8Array[] = [];
      const body = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      const blob = new Blob(chunks);
      return blob;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async delete(path: string): Promise<void> {
    if (!isR2Configured()) {
      throw new Error('R2 is not configured. Set VITE_R2_* environment variables.');
    }

    const client = createR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: path,
      })
    );
  },
};
