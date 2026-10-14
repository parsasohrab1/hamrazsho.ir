import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { requireAuth } from "@/middleware/requireAuth";
import { PLANS, addDays, isPlanId, planBySku } from "@/billing/plans";
import { computeEntitlement, stackedStart } from "@/billing/entitlement";
import { verifyBazaarSubscription, verifyMyketPurchase } from "@/billing/storeVerifiers";
import { requestPayment, verifyPayment } from "@/billing/zarinpal";

export const billingRouter = Router();

const zarinpalCfg = () => ({ merchantId: env.zarinpalMerchantId, sandbox: env.zarinpalSandbox });

const entitlementFor = async (userId: string) => {
  const rows = await prisma.purchase.findMany({
    where: { userId },
    select: { provider: true, planId: true, expiresAt: true, revokedAt: true, autoRenewing: true },
  });
  return computeEntitlement(rows);
};

/** Public: the plan catalogue (prices for the web checkout). */
billingRouter.get("/plans", (_req, res) => {
  res.json({
    plans: Object.values(PLANS).map((p) => ({
      id: p.id,
      sku: p.sku,
      durationDays: p.durationDays,
      webPriceRial: p.webPriceRial,
    })),
    providers: {
      bazaar: Boolean(env.bazaarApiSecret),
      myket: Boolean(env.myketAccessToken),
      zarinpal: Boolean(env.zarinpalMerchantId),
    },
  });
});

billingRouter.get("/entitlement", requireAuth, async (req, res, next) => {
  try {
    res.json(await entitlementFor(req.userId!));
  } catch (err) {
    next(err);
  }
});

const verifyLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });
const verifySchema = z.object({
  provider: z.enum(["bazaar", "myket"]),
  sku: z.string().min(1).max(100),
  purchaseToken: z.string().min(1).max(1000),
  orderId: z.string().max(200).optional(),
});

/** Verify a store receipt with the store's own server and grant premium.
 *  Idempotent per token: re-sending the same token for the same user just
 *  refreshes the expiry (this is how Bazaar auto-renewals are picked up on
 *  "restore purchases"). The same token can never unlock a second account. */
billingRouter.post("/verify", requireAuth, verifyLimiter, async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "'provider', 'sku' and 'purchaseToken' are required" });
      return;
    }
    const { provider, sku, purchaseToken, orderId } = parsed.data;
    const plan = planBySku(sku);
    if (!plan) {
      res.status(400).json({ error: `Unknown product '${sku}'` });
      return;
    }

    const existing = await prisma.purchase.findUnique({ where: { purchaseToken } });
    if (existing && existing.userId !== req.userId) {
      res.status(409).json({ error: "This purchase is already linked to another account" });
      return;
    }
    // Myket passes are one-off: once recorded, re-verifying must not extend them.
    if (existing && provider === "myket") {
      res.json(await entitlementFor(req.userId!));
      return;
    }

    const verified =
      provider === "bazaar"
        ? await verifyBazaarSubscription({
            packageName: env.appPackageName,
            sku,
            purchaseToken,
            apiSecret: env.bazaarApiSecret,
          })
        : await verifyMyketPurchase({
            packageName: env.appPackageName,
            sku,
            purchaseToken,
            accessToken: env.myketAccessToken,
            durationDays: plan.durationDays,
            startFrom: stackedStart(
              await prisma.purchase.findMany({
                where: { userId: req.userId! },
                select: { provider: true, planId: true, expiresAt: true, revokedAt: true, autoRenewing: true },
              })
            ),
          });

    await prisma.purchase.upsert({
      where: { purchaseToken },
      update: { expiresAt: verified.expiresAt, autoRenewing: verified.autoRenewing, raw: verified.raw as object },
      create: {
        userId: req.userId!,
        provider,
        planId: plan.id,
        productId: sku,
        purchaseToken,
        orderId,
        startsAt: verified.startsAt,
        expiresAt: verified.expiresAt,
        autoRenewing: verified.autoRenewing,
        raw: verified.raw as object,
      },
    });

    res.json(await entitlementFor(req.userId!));
  } catch (err) {
    next(err);
  }
});

// ---- Web checkout (Zarinpal) ----------------------------------------------

const checkoutSchema = z.object({ planId: z.string() });

billingRouter.post("/zarinpal/checkout", requireAuth, verifyLimiter, async (req, res, next) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success || !isPlanId(parsed.data.planId)) {
      res.status(400).json({ error: "A valid 'planId' is required" });
      return;
    }
    const plan = PLANS[parsed.data.planId];
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    const { authority, url } = await requestPayment(zarinpalCfg(), {
      amountRial: plan.webPriceRial,
      callbackUrl: `${env.publicApiUrl}/billing/zarinpal/callback`,
      description: `اشتراک ${plan.id === "premium_yearly" ? "سالانه" : "ماهانه"}`,
      mobile: user?.phone ? `0${user.phone.replace(/^\+98/, "")}` : undefined,
    });
    await prisma.paymentOrder.create({
      data: { userId: req.userId!, planId: plan.id, amountRial: plan.webPriceRial, authority },
    });
    res.json({ url, authority });
  } catch (err) {
    next(err);
  }
});

/** Browser redirect target after the Zarinpal page. Unauthenticated by
 *  necessity (it's a top-level redirect) — the order row, created by an
 *  authenticated user, is what ties the payment to an account. */
billingRouter.get("/zarinpal/callback", async (req, res, next) => {
  const back = (status: "success" | "failed" | "cancelled", extra = "") =>
    res.redirect(`${env.webAppUrl}/?payment=${status}${extra}`);
  try {
    const authority = String(req.query.Authority ?? "");
    const order = authority ? await prisma.paymentOrder.findUnique({ where: { authority } }) : null;
    if (!order) return back("failed");
    if (order.status === "paid") return back("success");
    if (String(req.query.Status) !== "OK") {
      await prisma.paymentOrder.update({ where: { id: order.id }, data: { status: "failed" } });
      return back("cancelled");
    }

    const result = await verifyPayment(zarinpalCfg(), { amountRial: order.amountRial, authority });
    if (!result.paid || !isPlanId(order.planId) || !order.userId) {
      await prisma.paymentOrder.update({ where: { id: order.id }, data: { status: "failed" } });
      return back("failed");
    }

    const plan = PLANS[order.planId];
    const priorRows = await prisma.purchase.findMany({
      where: { userId: order.userId },
      select: { provider: true, planId: true, expiresAt: true, revokedAt: true, autoRenewing: true },
    });
    const startsAt = stackedStart(priorRows);
    await prisma.$transaction([
      prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: "paid", refId: result.refId, cardPan: result.cardPan, paidAt: new Date() },
      }),
      prisma.purchase.create({
        data: {
          userId: order.userId,
          provider: "zarinpal",
          planId: plan.id,
          productId: plan.id,
          purchaseToken: `zarinpal:${authority}`,
          orderId: result.refId,
          startsAt,
          expiresAt: addDays(startsAt, plan.durationDays),
          raw: result.raw as object,
        },
      }),
    ]);
    return back("success", result.refId ? `&ref=${encodeURIComponent(result.refId)}` : "");
  } catch (err) {
    next(err);
  }
});
