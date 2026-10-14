import { Linking, Platform } from "react-native";
import { BAZAAR_RSA_KEY, STORE } from "@/config/release";
import { ClientPlan } from "@/billing/plans";
import { startWebCheckout, verifyStorePurchase, Entitlement } from "@/services/billingApi";

/**
 * One adapter per store. Every adapter ends the same way: the receipt goes
 * to the backend (POST /billing/verify), which checks it with the store's
 * server — the app never grants premium from a client-side result alone.
 */
export interface StoreBilling {
  /** "redirect" = payment continues in the browser (web); the entitlement
   *  is refreshed when the user comes back. */
  purchase(plan: ClientPlan): Promise<Entitlement | "redirect">;
  /** Re-send any receipts the store still holds (reinstall / new device /
   *  Bazaar auto-renewal). Returns the latest entitlement, or null if the
   *  store had nothing. */
  restore(plans: ClientPlan[]): Promise<Entitlement | null>;
}

export class BillingUnavailableError extends Error {}
export class PurchaseCancelledError extends Error {}

// ---- Cafe Bazaar (Poolakey) -----------------------------------------------

type PoolakeyPurchase = { purchaseToken: string; productId: string; orderId?: string };
type Poolakey = {
  connect(rsaKey: string | null): Promise<void>;
  subscribeProduct(productId: string): Promise<PoolakeyPurchase>;
  getSubscribedProducts(): Promise<PoolakeyPurchase[]>;
};

/** Required lazily: the native module is only linked into the Bazaar
 *  build (react-native.config.js), so a top-level import would crash every
 *  other flavor and the web build. */
const loadPoolakey = (): Poolakey => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@cafebazaar/react-native-poolakey");
    return (mod.default ?? mod) as Poolakey;
  } catch {
    throw new BillingUnavailableError("ماژول پرداخت بازار در این نسخه از برنامه موجود نیست.");
  }
};

const isCancel = (e: unknown) => /cancel/i.test(String((e as Error)?.message ?? e));

let bazaarConnected: Promise<void> | null = null;
const connectBazaar = (pk: Poolakey) => {
  if (!bazaarConnected) {
    bazaarConnected = pk.connect(BAZAAR_RSA_KEY || null).catch((e) => {
      bazaarConnected = null;
      throw new BillingUnavailableError(
        /not.?found|install/i.test(String(e)) ? "برای خرید، برنامهٔ کافه‌بازار باید روی گوشی نصب باشد." : String(e)
      );
    });
  }
  return bazaarConnected;
};

const bazaarBilling: StoreBilling = {
  async purchase(plan) {
    const pk = loadPoolakey();
    await connectBazaar(pk);
    let p: PoolakeyPurchase;
    try {
      p = await pk.subscribeProduct(plan.sku);
    } catch (e) {
      if (isCancel(e)) throw new PurchaseCancelledError();
      throw e;
    }
    return verifyStorePurchase({ provider: "bazaar", sku: p.productId || plan.sku, purchaseToken: p.purchaseToken, orderId: p.orderId });
  },
  async restore(plans) {
    const pk = loadPoolakey();
    await connectBazaar(pk);
    const skus = new Set(plans.map((p) => p.sku));
    const owned = (await pk.getSubscribedProducts()).filter((p) => skus.has(p.productId));
    let latest: Entitlement | null = null;
    for (const p of owned) {
      latest = await verifyStorePurchase({ provider: "bazaar", sku: p.productId, purchaseToken: p.purchaseToken, orderId: p.orderId });
    }
    return latest;
  },
};

// ---- Web (Zarinpal via backend) --------------------------------------------

const webBilling: StoreBilling = {
  async purchase(plan) {
    const { url } = await startWebCheckout(plan.id);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign(url);
    } else {
      await Linking.openURL(url);
    }
    return "redirect";
  },
  async restore() {
    // Web payments are recorded server-side; the entitlement fetch is the restore.
    return null;
  },
};

const unavailable: StoreBilling = {
  async purchase() {
    throw new BillingUnavailableError("خرید اشتراک در این نسخه از برنامه فعال نیست.");
  },
  async restore() {
    return null;
  },
};

export const getStoreBilling = (): StoreBilling => {
  if (STORE === "bazaar") return bazaarBilling;
  if (STORE === "web" || Platform.OS === "web") return webBilling;
  return unavailable;
};
