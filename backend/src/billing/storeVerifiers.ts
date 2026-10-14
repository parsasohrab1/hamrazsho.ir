/**
 * Server-to-server receipt verification for the Iranian Android stores.
 *
 * The client NEVER decides it is premium on its own: it sends the store's
 * purchase token here, we ask the store's own server whether that token is
 * real, and only then record a Purchase row. Store API secrets live only in
 * server env vars — never in the app bundle.
 *
 * - Cafe Bazaar: REST API v2 subscription validation, auth via the
 *   `CAFEBAZAAR-PISHKHAN-API-SECRET` header (token from the Pishkhan panel).
 *   https://developers.cafebazaar.ir/en/guidelines/in-app-billing/api/subscription
 * - Myket: in-app product verify API, auth via `X-Access-Token`.
 *   https://myket.ir/kb/pages/server-to-server-payment-validation-api/
 */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface VerifiedStorePurchase {
  startsAt: Date;
  expiresAt: Date;
  autoRenewing: boolean;
  raw: unknown;
}

export class StoreVerificationError extends Error {
  status = 402;
  constructor(message: string) {
    super(message);
  }
}

export class StoreNotConfiguredError extends Error {
  status = 503;
  constructor(store: string, envVar: string) {
    super(`${store} verification is not configured on the server (set ${envVar})`);
  }
}

// ---- Cafe Bazaar -----------------------------------------------------------

export const bazaarSubscriptionUrl = (packageName: string, sku: string, token: string) =>
  `https://pardakht.cafebazaar.ir/devapi/v2/api/applications/${encodeURIComponent(packageName)}` +
  `/subscriptions/${encodeURIComponent(sku)}/purchases/${encodeURIComponent(token)}/`;

/** Pure parser — exported for tests. */
export const parseBazaarSubscription = (body: unknown, now: Date = new Date()): VerifiedStorePurchase => {
  const b = body as { validUntilTimestampMsec?: number | string; initiationTimestampMsec?: number | string; autoRenewing?: boolean };
  const until = Number(b?.validUntilTimestampMsec);
  if (!Number.isFinite(until) || until <= 0) {
    throw new StoreVerificationError("Bazaar response has no valid 'validUntilTimestampMsec'");
  }
  if (until <= now.getTime()) throw new StoreVerificationError("This Bazaar subscription has already expired");
  const start = Number(b.initiationTimestampMsec);
  return {
    startsAt: Number.isFinite(start) && start > 0 ? new Date(start) : now,
    expiresAt: new Date(until),
    autoRenewing: Boolean(b.autoRenewing),
    raw: body,
  };
};

export const verifyBazaarSubscription = async (
  opts: { packageName: string; sku: string; purchaseToken: string; apiSecret: string },
  fetchImpl: FetchLike = fetch
): Promise<VerifiedStorePurchase> => {
  if (!opts.apiSecret) throw new StoreNotConfiguredError("Cafe Bazaar", "BAZAAR_API_SECRET");
  const res = await fetchImpl(bazaarSubscriptionUrl(opts.packageName, opts.sku, opts.purchaseToken), {
    headers: { "CAFEBAZAAR-PISHKHAN-API-SECRET": opts.apiSecret },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const desc = (body as { error_description?: string; error?: string }).error_description ?? (body as { error?: string }).error;
    throw new StoreVerificationError(`Bazaar rejected the purchase token (${res.status}${desc ? `: ${desc}` : ""})`);
  }
  return parseBazaarSubscription(body);
};

// ---- Myket -----------------------------------------------------------------

export const myketVerifyUrl = (packageName: string, sku: string) =>
  `https://developer.myket.ir/api/partners/applications/${encodeURIComponent(packageName)}` +
  `/purchases/products/${encodeURIComponent(sku)}/verify`;

/** Pure parser — exported for tests. `durationDays` comes from the plan
 *  because a Myket pass is a one-off product, not a store-side subscription. */
export const parseMyketPurchase = (
  body: unknown,
  durationDays: number,
  startFrom: Date
): VerifiedStorePurchase => {
  const b = body as { purchaseState?: number; purchaseTime?: number };
  if (b?.purchaseState !== 0) throw new StoreVerificationError("Myket reports this purchase as not successful");
  return {
    startsAt: startFrom,
    expiresAt: new Date(startFrom.getTime() + durationDays * 86_400_000),
    autoRenewing: false,
    raw: body,
  };
};

export const verifyMyketPurchase = async (
  opts: { packageName: string; sku: string; purchaseToken: string; accessToken: string; durationDays: number; startFrom: Date },
  fetchImpl: FetchLike = fetch
): Promise<VerifiedStorePurchase> => {
  if (!opts.accessToken) throw new StoreNotConfiguredError("Myket", "MYKET_ACCESS_TOKEN");
  const res = await fetchImpl(myketVerifyUrl(opts.packageName, opts.sku), {
    method: "POST",
    headers: { "X-Access-Token": opts.accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId: opts.purchaseToken }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new StoreVerificationError(`Myket rejected the purchase token (${res.status})`);
  return parseMyketPurchase(body, opts.durationDays, opts.startFrom);
};
