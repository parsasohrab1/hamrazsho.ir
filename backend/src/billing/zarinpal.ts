/**
 * Zarinpal payment gateway (REST v4) — used for the web/PWA build, where
 * there is no app store to take the payment.
 *
 * Flow: POST request.json → redirect user to StartPay/<authority> →
 * Zarinpal redirects back to our callback with ?Authority=&Status= →
 * we POST verify.json server-side. Only a verify `code` of 100 (verified
 * now) or 101 (already verified earlier) counts as paid — the `Status=OK`
 * query param on the callback is user-controlled and is never trusted
 * on its own.
 */
import type { FetchLike } from "./storeVerifiers";

export interface ZarinpalConfig {
  merchantId: string;
  sandbox: boolean;
}

const base = (sandbox: boolean) => (sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com");

export const startPayUrl = (authority: string, sandbox: boolean) => `${base(sandbox)}/pg/StartPay/${authority}`;

export class ZarinpalError extends Error {
  status = 502;
}

export const requestPayment = async (
  cfg: ZarinpalConfig,
  opts: { amountRial: number; callbackUrl: string; description: string; mobile?: string },
  fetchImpl: FetchLike = fetch
): Promise<{ authority: string; url: string }> => {
  if (!cfg.merchantId) {
    const e = new ZarinpalError("Web payments are not configured on the server (set ZARINPAL_MERCHANT_ID)");
    e.status = 503;
    throw e;
  }
  const res = await fetchImpl(`${base(cfg.sandbox)}/pg/v4/payment/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      merchant_id: cfg.merchantId,
      amount: opts.amountRial,
      currency: "IRR",
      callback_url: opts.callbackUrl,
      description: opts.description,
      metadata: opts.mobile ? { mobile: opts.mobile } : undefined,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: { code?: number; authority?: string } };
  const authority = body.data?.authority;
  if (body.data?.code !== 100 || !authority) {
    throw new ZarinpalError(`Zarinpal payment request failed (${JSON.stringify(body).slice(0, 200)})`);
  }
  return { authority, url: startPayUrl(authority, cfg.sandbox) };
};

/** Pure parser — exported for tests. */
export const parseVerify = (body: unknown): { paid: boolean; refId?: string; cardPan?: string } => {
  const d = (body as { data?: { code?: number; ref_id?: number | string; card_pan?: string } })?.data;
  const paid = d?.code === 100 || d?.code === 101;
  return { paid, refId: d?.ref_id !== undefined ? String(d.ref_id) : undefined, cardPan: d?.card_pan };
};

export const verifyPayment = async (
  cfg: ZarinpalConfig,
  opts: { amountRial: number; authority: string },
  fetchImpl: FetchLike = fetch
) => {
  const res = await fetchImpl(`${base(cfg.sandbox)}/pg/v4/payment/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ merchant_id: cfg.merchantId, amount: opts.amountRial, authority: opts.authority }),
  });
  const body = await res.json().catch(() => ({}));
  return { ...parseVerify(body), raw: body };
};
