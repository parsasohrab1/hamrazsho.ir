/**
 * Premium plans. The same SKU ids must be created in every store console
 * (Cafe Bazaar "اشتراک", Myket "محصول درون‌برنامه‌ای") — the client uses
 * the identical list in mental-wellness-assistant/src/billing/plans.ts.
 *
 * Why Myket uses a one-off "pass" product instead of an auto-renewing
 * subscription: Myket's documented server-to-server verify API covers
 * in-app products, so a time-limited pass that is verified server-side and
 * then consumed (so it can be bought again) is the path we can verify
 * end to end. Bazaar has a documented subscription-validation API, so it
 * uses a real auto-renewing subscription.
 */
export type PlanId = "premium_monthly" | "premium_yearly";

export interface Plan {
  id: PlanId;
  /** SKU in Cafe Bazaar / Myket consoles. */
  sku: string;
  durationDays: number;
  /** Web (Zarinpal) price, in Rial. Overridable via env so a price change
   *  doesn't need a code release. */
  webPriceRial: number;
}

const intEnv = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const PLANS: Record<PlanId, Plan> = {
  premium_monthly: {
    id: "premium_monthly",
    sku: "hamraz_premium_monthly",
    durationDays: 31,
    webPriceRial: intEnv("PRICE_MONTHLY_RIAL", 1_490_000),
  },
  premium_yearly: {
    id: "premium_yearly",
    sku: "hamraz_premium_yearly",
    durationDays: 366,
    webPriceRial: intEnv("PRICE_YEARLY_RIAL", 11_900_000),
  },
};

export const isPlanId = (v: unknown): v is PlanId => typeof v === "string" && v in PLANS;

export const planBySku = (sku: string): Plan | undefined => Object.values(PLANS).find((p) => p.sku === sku);

export const addDays = (from: Date, days: number) => new Date(from.getTime() + days * 86_400_000);
