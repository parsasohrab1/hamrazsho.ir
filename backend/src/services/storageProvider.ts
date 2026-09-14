import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { env } from "@/lib/env";

export interface StorageProvider {
  /** Persists a file's bytes and returns an opaque storageKey to save on the UserFile row. */
  save(userId: string, buffer: Buffer, originalMimeType: string): Promise<{ storageKey: string }>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

/** Default provider — writes under env.uploadsDir, namespaced per user.
 *  storageKey is a relative path like "<userId>/<uuid>". Fine for a single
 *  server instance; a real multi-instance deploy needs shared storage
 *  (see s3StorageProvider below) so any app instance can serve any file. */
const localStorageProvider: StorageProvider = {
  async save(userId, buffer) {
    const dir = path.join(env.uploadsDir, userId);
    await fs.mkdir(dir, { recursive: true });
    const storageKey = `${userId}/${randomUUID()}`;
    await fs.writeFile(path.join(env.uploadsDir, storageKey), buffer);
    return { storageKey };
  },

  async read(storageKey) {
    return fs.readFile(path.join(env.uploadsDir, storageKey));
  },

  async delete(storageKey) {
    await fs.rm(path.join(env.uploadsDir, storageKey), { force: true });
  },
};

/** Not implemented — documented honestly rather than faking success.
 *  Swapping to real S3-compatible storage (for multi-instance deploys)
 *  means filling this in with the AWS SDK (or a compatible client for
 *  Arvan/Liara/etc. object storage) using env-provided credentials/bucket,
 *  then flipping STORAGE_PROVIDER=s3. Kept as a stub so the pluggable
 *  interface is visible in code before there's a real bucket to point it at. */
const s3StorageProvider: StorageProvider = {
  async save() {
    throw new Error("S3 storage provider is not implemented yet — set STORAGE_PROVIDER=local");
  },
  async read() {
    throw new Error("S3 storage provider is not implemented yet — set STORAGE_PROVIDER=local");
  },
  async delete() {
    throw new Error("S3 storage provider is not implemented yet — set STORAGE_PROVIDER=local");
  },
};

export const getStorageProvider = (): StorageProvider =>
  env.storageProvider === "s3" ? s3StorageProvider : localStorageProvider;
