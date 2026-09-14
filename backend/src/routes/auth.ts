import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  generateOtpCode,
  hashOtpCode,
  isOtpExpired,
  normalizePhone,
  otpExpiryDate,
  verifyOtpCode,
} from "@/services/otpService";
import { getSmsProvider } from "@/services/smsProvider";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/services/jwtService";

export const authRouter = Router();

// Coarse per-IP limiter on top of the per-phone cooldown below — blunts
// basic abuse (e.g. hammering random phone numbers) without needing Redis.
const otpRequestLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

const requestOtpSchema = z.object({ phone: z.string().min(5) });

authRouter.post("/request-otp", otpRequestLimiter, async (req, res, next) => {
  try {
    const parsed = requestOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A valid 'phone' field is required" });
      return;
    }
    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      res.status(400).json({ error: "Phone number doesn't look valid" });
      return;
    }

    const mostRecent = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (mostRecent) {
      const secondsSince = (Date.now() - mostRecent.createdAt.getTime()) / 1000;
      if (secondsSince < env.otpRequestCooldownSec) {
        res.status(429).json({
          error: `Please wait ${Math.ceil(env.otpRequestCooldownSec - secondsSince)}s before requesting another code`,
        });
        return;
      }
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code);
    await prisma.otpCode.create({
      data: { phone, codeHash, expiresAt: otpExpiryDate(env.otpTtlMin) },
    });

    await getSmsProvider().sendOtp(phone, code);

    const devEcho = env.isProduction ? {} : { devCode: code };
    res.json({ ok: true, phone, expiresInMin: env.otpTtlMin, ...devEcho });
  } catch (err) {
    next(err);
  }
});

const verifyOtpSchema = z.object({ phone: z.string().min(5), code: z.string().length(6) });

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "'phone' and a 6-digit 'code' are required" });
      return;
    }
    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      res.status(400).json({ error: "Phone number doesn't look valid" });
      return;
    }

    const otp = await prisma.otpCode.findFirst({
      where: { phone, consumed: false },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) {
      res.status(400).json({ error: "No pending code for this phone — request a new one" });
      return;
    }
    if (isOtpExpired(otp.expiresAt)) {
      res.status(400).json({ error: "Code expired — request a new one" });
      return;
    }
    if (otp.attempts >= env.otpMaxAttempts) {
      res.status(429).json({ error: "Too many attempts — request a new code" });
      return;
    }

    const valid = await verifyOtpCode(parsed.data.code, otp.codeHash);
    if (!valid) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      res.status(400).json({ error: "Incorrect code" });
      return;
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    res.json({
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
      user: { id: user.id, phone: user.phone },
    });
  } catch (err) {
    next(err);
  }
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "'refreshToken' is required" });
      return;
    }
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }
    res.json({ accessToken: signAccessToken(user.id), refreshToken: signRefreshToken(user.id) });
  } catch (err) {
    next(err);
  }
});
