import { FEATURES, FREE_TRIAL_USES, canUseFeature, isFeatureVisible, trialUsesLeft } from "@/config/features";
import { countsForMonth } from "@/state/useFeatureUsage";
import { formatToman, PLANS } from "@/billing/plans";
import { isConsentCurrent } from "@/state/useConsent";
import { isEntitlementActive } from "@/state/PremiumContext";

const SAFETY_FEATURES = ["screening", "companion", "mentalHealth", "activeListening", "quitCoach", "counseling"];

describe("feature catalogue", () => {
  it("never puts safety / mental-health features behind the paywall", () => {
    for (const id of SAFETY_FEATURES) {
      expect(FEATURES.find((f) => f.id === id)?.tier).toBe("free");
    }
  });

  it("has unique ids and routes", () => {
    expect(new Set(FEATURES.map((f) => f.id)).size).toBe(FEATURES.length);
    expect(new Set(FEATURES.map((f) => f.route)).size).toBe(FEATURES.length);
  });

  it("hides demo-only features from store builds", () => {
    const music = FEATURES.find((f) => f.id === "music")!;
    expect(isFeatureVisible(music, { showDemo: false, premiumMode: "billing" })).toBe(false);
    expect(isFeatureVisible(music, { showDemo: true, premiumMode: "billing" })).toBe(true);
  });

  it("keeps trial features visible (and free) in builds that can't sell", () => {
    const legal = FEATURES.find((f) => f.id === "legal")!;
    expect(isFeatureVisible(legal, { showDemo: false, premiumMode: "hidden" })).toBe(true);
    expect(canUseFeature(legal, false, "hidden", 999)).toBe(true);
  });

  it("makes every paid feature a monthly trial", () => {
    expect(FEATURES.filter((f) => f.tier === "premium")).toEqual([]);
    const trial = FEATURES.filter((f) => f.tier === "trial").map((f) => f.id).sort();
    expect(trial).toEqual(["career", "family", "gift", "legal", "recipes", "social", "style", "tasks"]);
  });

  it("allows FREE_TRIAL_USES free uses, then requires premium", () => {
    const legal = FEATURES.find((f) => f.id === "legal")!;
    const screening = FEATURES.find((f) => f.id === "screening")!;
    expect(FREE_TRIAL_USES).toBe(10);
    expect(canUseFeature(legal, false, "billing", 0)).toBe(true);
    expect(canUseFeature(legal, false, "billing", 9)).toBe(true);
    expect(canUseFeature(legal, false, "billing", 10)).toBe(false);
    expect(canUseFeature(legal, true, "billing", 10)).toBe(true);
    expect(canUseFeature(legal, false, "unlocked", 50)).toBe(true);
    expect(canUseFeature(screening, false, "billing", 500)).toBe(true);
    expect(trialUsesLeft(legal, false, 3, "billing")).toBe(7);
    expect(trialUsesLeft(legal, true, 3, "billing")).toBeNull();
    expect(trialUsesLeft(screening, false, 3, "billing")).toBeNull();
  });

  it("resets usage counters when the Persian month changes", () => {
    expect(countsForMonth({ month: "1405-06", counts: { legal: 10 } }, "1405-07")).toEqual({});
    expect(countsForMonth({ month: "1405-07", counts: { legal: 4 } }, "1405-07")).toEqual({ legal: 4 });
    expect(countsForMonth(null, "1405-07")).toEqual({});
  });
});

describe("plans", () => {
  it("uses the SKUs registered on the backend", () => {
    expect(PLANS.map((p) => p.sku).sort()).toEqual(["hamraz_premium_monthly", "hamraz_premium_yearly"]);
  });

  it("formats Toman with Persian digits", () => {
    expect(formatToman(1190000)).toBe("۱٬۱۹۰٬۰۰۰ تومان");
  });
});

describe("consent", () => {
  it("requires the current legal version and the 18+ confirmation", () => {
    expect(isConsentCurrent(null, "v2")).toBe(false);
    expect(isConsentCurrent({ version: "v1", acceptedAt: "", adultConfirmed: true }, "v2")).toBe(false);
    expect(isConsentCurrent({ version: "v2", acceptedAt: "", adultConfirmed: false }, "v2")).toBe(false);
    expect(isConsentCurrent({ version: "v2", acceptedAt: "", adultConfirmed: true }, "v2")).toBe(true);
  });
});

describe("entitlement cache", () => {
  const now = new Date("2026-09-23T00:00:00Z");
  it("expires on its own expiresAt even offline", () => {
    const base = { provider: "bazaar", planId: "premium_monthly", autoRenewing: true, premium: true };
    expect(isEntitlementActive({ ...base, expiresAt: "2026-10-01T00:00:00Z" }, now)).toBe(true);
    expect(isEntitlementActive({ ...base, expiresAt: "2026-09-01T00:00:00Z" }, now)).toBe(false);
    expect(isEntitlementActive({ ...base, premium: false, expiresAt: "2026-10-01T00:00:00Z" }, now)).toBe(false);
  });
});
