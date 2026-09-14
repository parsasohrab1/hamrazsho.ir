import express from "express";
import cors from "cors";
import { authRouter } from "@/routes/auth";
import { dataRouter } from "@/routes/data";
import { filesRouter } from "@/routes/files";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/data", dataRouter);
  app.use("/files", filesRouter);

  // Centralized error handler — keeps stack traces out of API responses.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = err instanceof Error && "status" in err ? Number((err as { status: number }).status) : 500;
    if (status >= 500) console.error(err);
    res.status(status || 500).json({ error: message });
  });

  return app;
};
