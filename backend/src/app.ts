import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "@/lib/env";
import { authRouter } from "@/routes/auth";
import { dataRouter } from "@/routes/data";
import { filesRouter } from "@/routes/files";
import { skillsRouter } from "@/routes/skills";
import { billingRouter } from "@/routes/billing";
import { accountRouter } from "@/routes/account";

export const createApp = () => {
  const app = express();

  if (env.trustProxy > 0) app.set("trust proxy", env.trustProxy);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
    })
  );
  // Global ceiling per IP; the auth/billing routes add tighter limits.
  app.use(rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/data", dataRouter);
  app.use("/files", filesRouter);
  app.use("/skills", skillsRouter);
  app.use("/billing", billingRouter);
  app.use("/account", accountRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Centralized error handler — keeps stack traces out of API responses.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = err instanceof Error && "status" in err ? Number((err as { status: number }).status) : 500;
    if (status >= 500) console.error(err);
    // Never leak internal error text (DB errors, file paths) in production.
    const safeMessage = status >= 500 && env.isProduction ? "Internal server error" : message;
    res.status(status || 500).json({ error: safeMessage });
  });

  return app;
};
