import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/requireAuth";
import { isValidDataKey, isValueWithinSizeLimit, MAX_VALUE_BYTES } from "@/services/userDataValidation";

export const dataRouter = Router();

dataRouter.use(requireAuth);

/** List every key this user has stored — used for a full sync/restore
 *  (e.g. logging into a new device). */
dataRouter.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.userData.findMany({
      where: { userId: req.userId! },
      select: { key: true, value: true, updatedAt: true },
    });
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

dataRouter.get("/:key", async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!isValidDataKey(key)) {
      res.status(400).json({ error: "Invalid key format" });
      return;
    }
    const row = await prisma.userData.findUnique({
      where: { userId_key: { userId: req.userId!, key } },
    });
    if (!row) {
      res.status(404).json({ error: "No value stored for this key" });
      return;
    }
    res.json({ key: row.key, value: row.value, updatedAt: row.updatedAt });
  } catch (err) {
    next(err);
  }
});

dataRouter.put("/:key", async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!isValidDataKey(key)) {
      res.status(400).json({ error: "Invalid key format" });
      return;
    }
    if (!("value" in req.body)) {
      res.status(400).json({ error: "Request body must include a 'value' field" });
      return;
    }
    const { value } = req.body;
    if (!isValueWithinSizeLimit(value)) {
      res.status(413).json({ error: `Value too large — max ${MAX_VALUE_BYTES} bytes of JSON` });
      return;
    }

    const row = await prisma.userData.upsert({
      where: { userId_key: { userId: req.userId!, key } },
      update: { value },
      create: { userId: req.userId!, key, value },
    });
    res.json({ key: row.key, value: row.value, updatedAt: row.updatedAt });
  } catch (err) {
    next(err);
  }
});

dataRouter.delete("/:key", async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!isValidDataKey(key)) {
      res.status(400).json({ error: "Invalid key format" });
      return;
    }
    await prisma.userData.deleteMany({ where: { userId: req.userId!, key } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
