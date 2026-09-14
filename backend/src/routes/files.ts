import { Router } from "express";
import multer from "multer";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { requireAuth } from "@/middleware/requireAuth";
import { getStorageProvider } from "@/services/storageProvider";

export const filesRouter = Router();

filesRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});

/** List this user's uploaded files (metadata only — fetch bytes via GET /files/:id). */
filesRouter.get("/", async (req, res, next) => {
  try {
    const files = await prisma.userFile.findMany({
      where: { userId: req.userId! },
      select: { id: true, key: true, mimeType: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

filesRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Multipart field 'file' is required" });
      return;
    }
    const key = typeof req.body.key === "string" && req.body.key.trim() ? req.body.key.trim() : "file";

    const { storageKey } = await getStorageProvider().save(req.userId!, req.file.buffer, req.file.mimetype);

    const row = await prisma.userFile.create({
      data: {
        userId: req.userId!,
        key,
        storageKey,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });

    res.status(201).json({
      id: row.id,
      key: row.key,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

filesRouter.get("/:id", async (req, res, next) => {
  try {
    // Scoped to req.userId so one user can never fetch another's file by
    // guessing/incrementing an id — a mismatch reads as 404, not 403, to
    // avoid confirming the id exists at all.
    const row = await prisma.userFile.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!row) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const buffer = await getStorageProvider().read(row.storageKey);
    res.setHeader("Content-Type", row.mimeType);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

filesRouter.delete("/:id", async (req, res, next) => {
  try {
    const row = await prisma.userFile.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!row) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    await getStorageProvider().delete(row.storageKey);
    await prisma.userFile.delete({ where: { id: row.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
