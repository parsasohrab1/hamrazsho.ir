/** Mirrors backend/src/billing/plans.ts — SKU ids must match the store
 *  consoles exactly. Web prices are fetched from GET /billing/plans so a
 *  price change never needs an app release; `fallbackPriceToman` is only
 *  for display before that request returns. On Bazaar, the store shows its
 *  own price in its purchase sheet. */
export type PlanId = "premium_monthly" | "premium_yearly";

export interface ClientPlan {
  id: PlanId;
  sku: string;
  title: { fa: string; en: string };
  fallbackPriceToman: number;
  badge?: { fa: string; en: string };
}

export const PLANS: ClientPlan[] = [
  {
    id: "premium_monthly",
    sku: "hamraz_premium_monthly",
    title: { fa: "اشتراک ماهانه", en: "Monthly" },
    fallbackPriceToman: 149_000,
  },
  {
    id: "premium_yearly",
    sku: "hamraz_premium_yearly",
    title: { fa: "اشتراک سالانه", en: "Yearly" },
    fallbackPriceToman: 1_190_000,
    badge: { fa: "۳۳٪ ارزان‌تر", en: "Save 33%" },
  },
];

export const planById = (id: PlanId): ClientPlan => PLANS.find((p) => p.id === id)!;

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
/** 1190000 → "۱٬۱۹۰٬۰۰۰ تومان" */
export const formatToman = (toman: number): string =>
  `${Math.round(toman)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "٬")
    .replace(/\d/g, (d) => FA_DIGITS[Number(d)])} تومان`;
