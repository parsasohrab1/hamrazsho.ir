import { computeEntitlement, stackedStart } from "@/billing/entitlement";
import { PLANS, planBySku } from "@/billing/plans";
import {
  StoreNotConfiguredError,
  StoreVerificationError,
  bazaarSubscriptionUrl,
  parseBazaarSubscription,
  parseMyketPurchase,
  verifyBazaarSubscription,
  verifyMyketPurchase,
} from "@/billing/storeVerifiers";
import { parseVerify, requestPayment, startPayUrl } from "@/billing/zarinpal";

const now = new Date("2026-09-23T10:00:00Z");
const day = 86_400_000;
const row = (expiresInDays: number, extra: Partial<{ revokedAt: Date | null; provider: string }> = {}) => ({
  provider: extra.provider ?? "bazaar",
  planId: "premium_monthly",
  expiresAt: new Date(now.getTime() + expiresInDays * day),
  revokedAt: extra.revokedAt ?? null,
  autoRenewing: false,
});

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

describe("entitlement", () => {
  it("is not premium with no purchases", () => {
    expect(computeEntitlement([], now).premium).toBe(false);
  });

  it("ignores expired and revoked grants", () => {
    const e = computeEntitlement([row(-1), row(10, { revokedAt: now })], now);
    expect(e.premium).toBe(false);
  });

  it("reports the longest active grant", () => {
    const e = computeEntitlement([row(5), row(40, { provider: "myket" }), row(-3)], now);
    expect(e.premium).toBe(true);
    expect(e.provider).toBe("myket");
    expect(e.expiresAt).toBe(new Date(now.getTime() + 40 * day).toISOString());
  });

  it("stacks a new pass after the current expiry", () => {
    expect(stackedStart([row(5)], now).getTime()).toBe(now.getTime() + 5 * day);
    expect(stackedStart([row(-5)], now).getTime()).toBe(now.getTime());
  });
});

describe("plans", () => {
  it("maps store SKUs back to plans", () => {
    expect(planBySku("hamraz_premium_yearly")?.id).toBe("premium_yearly");
    expect(planBySku("nope")).toBeUndefined();
    expect(PLANS.premium_yearly.durationDays).toBeGreaterThan(PLANS.premium_monthly.durationDays);
  });
});

describe("Cafe Bazaar verification", () => {
  it("builds the documented v2 subscription URL", () => {
    expect(bazaarSubscriptionUrl("ir.hamrazsho.app", "sku1", "tok")).toBe(
      "https://pardakht.cafebazaar.ir/devapi/v2/api/applications/ir.hamrazsho.app/subscriptions/sku1/purchases/tok/"
    );
  });

  it("parses a valid subscription response", () => {
    const until = now.getTime() + 30 * day;
    const v = parseBazaarSubscription(
      { validUntilTimestampMsec: until, initiationTimestampMsec: now.getTime(), autoRenewing: true },
      now
    );
    expect(v.expiresAt.getTime()).toBe(until);
    expect(v.autoRenewing).toBe(true);
  });

  it("rejects expired or malformed responses", () => {
    expect(() => parseBazaarSubscription({ validUntilTimestampMsec: now.getTime() - 1 }, now)).toThrow(
      StoreVerificationError
    );
    expect(() => parseBazaarSubscription({}, now)).toThrow(StoreVerificationError);
  });

  it("refuses to run without a server secret", async () => {
    await expect(
      verifyBazaarSubscription({ packageName: "p", sku: "s", purchaseToken: "t", apiSecret: "" })
    ).rejects.toBeInstanceOf(StoreNotConfiguredError);
  });

  it("sends the Pishkhan secret header and surfaces store rejections", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(404, { error: "not_found", error_description: "bad token" }));
    await expect(
      verifyBazaarSubscription({ packageName: "p", sku: "s", purchaseToken: "t", apiSecret: "sec" }, fetchMock)
    ).rejects.toThrow(/bad token/);
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)["CAFEBAZAAR-PISHKHAN-API-SECRET"]).toBe("sec");
  });
});

describe("Myket verification", () => {
  it("grants durationDays from the start date on purchaseState 0", () => {
    const v = parseMyketPurchase({ purchaseState: 0 }, 31, now);
    expect(v.expiresAt.getTime()).toBe(now.getTime() + 31 * day);
  });

  it("rejects failed purchases", () => {
    expect(() => parseMyketPurchase({ purchaseState: 1 }, 31, now)).toThrow(StoreVerificationError);
  });

  it("POSTs the token with X-Access-Token", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(200, { purchaseState: 0 }));
    await verifyMyketPurchase(
      { packageName: "p", sku: "s", purchaseToken: "tok", accessToken: "acc", durationDays: 31, startFrom: now },
      fetchMock
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://developer.myket.ir/api/partners/applications/p/purchases/products/s/verify");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["X-Access-Token"]).toBe("acc");
    expect(JSON.parse(String(init.body))).toEqual({ tokenId: "tok" });
  });
});

describe("Zarinpal", () => {
  it("treats only codes 100/101 as paid", () => {
    expect(parseVerify({ data: { code: 100, ref_id: 123 } })).toEqual({ paid: true, refId: "123", cardPan: undefined });
    expect(parseVerify({ data: { code: 101 } }).paid).toBe(true);
    expect(parseVerify({ data: { code: -9 } }).paid).toBe(false);
    expect(parseVerify({}).paid).toBe(false);
  });

  it("uses the sandbox host when configured", () => {
    expect(startPayUrl("A1", true)).toBe("https://sandbox.zarinpal.com/pg/StartPay/A1");
    expect(startPayUrl("A1", false)).toBe("https://payment.zarinpal.com/pg/StartPay/A1");
  });

  it("refuses to request a payment without a merchant id", async () => {
    await expect(
      requestPayment({ merchantId: "", sandbox: true }, { amountRial: 1, callbackUrl: "x", description: "d" })
    ).rejects.toThrow(/ZARINPAL_MERCHANT_ID/);
  });

  it("returns the StartPay URL for a successful request", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(200, { data: { code: 100, authority: "A00001" } }));
    const r = await requestPayment(
      { merchantId: "m", sandbox: true },
      { amountRial: 1000, callbackUrl: "https://api/cb", description: "d" },
      fetchMock
    );
    expect(r).toEqual({ authority: "A00001", url: "https://sandbox.zarinpal.com/pg/StartPay/A00001" });
  });
});
