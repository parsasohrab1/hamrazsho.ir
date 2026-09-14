import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "@/services/jwtService";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** Requires a valid `Authorization: Bearer <accessToken>` header; attaches
 *  the authenticated user's id to req.userId, or responds 401. */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    res.status(401).json({ error: "Missing Authorization: Bearer <token> header" });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};
