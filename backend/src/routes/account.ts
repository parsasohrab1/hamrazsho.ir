import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/requireAuth";
import { getStorageProvider } from "@/services/storageProvider";

/**
 * Account self-service. Both are store requirements, not nice-to-haves:
 * Google Play requires in-app account deletion for any app that lets
 * users create an account, and the privacy policy promises users can get
 * a copy of their data.
 */
export const accountRouter = Router();

accountRouter.use(requireAuth);

/** Everything we hold about this user, as one JSON download. */
accountRouter.get("/export", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        data: { select: { key: true, value: true, updatedAt: true } },
        files: { select: { id: true, key: true, mimeType: true, sizeBytes: true, createdAt: true } },
        purchases: {
          select: { provider: true, planId: true, startsAt: true, expiresAt: true, autoRenewing: true, createdAt: true },
        },
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.setHeader("Content-Disposition", 'attachment; filename="my-data.json"');
    res.json({ exportedAt: new Date().toISOString(), user });
  } catch (err) {
    next(err);
  }
});

/** Permanently delete the account: synced data, uploaded files (bytes and
 *  rows), pending OTP codes. Payment records are detached (userId → null),
 *  not deleted, because financial records must be retained — see the
 *  Purchase model comment in prisma/schema.prisma. */
accountRouter.delete("/", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, include: { files: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const storage = getStorageProvider();
    for (const f of user.files) {
      await storage.delete(f.storageKey).catch((err) => console.error("file delete failed", f.id, err));
    }
    await prisma.$transaction([
      prisma.otpCode.deleteMany({ where: { phone: user.phone } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
