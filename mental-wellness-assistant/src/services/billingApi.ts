import { authorizedRequest, publicRequest } from "@/services/apiClient";

export interface Entitlement {
  premium: boolean;
  expiresAt: string | null;
  provider: string | null;
  planId: string | null;
  autoRenewing: boolean;
}

export interface ServerPlan {
  id: string;
  sku: string;
  durationDays: number;
  webPriceRial: number;
}

export const getPlans = () =>
  publicRequest<{ plans: ServerPlan[]; providers: Record<string, boolean> }>("/billing/plans");

export const getEntitlement = () => authorizedRequest<Entitlement>("/billing/entitlement");

/** Hand a store receipt to the backend, which verifies it with the store's
 *  own server before granting anything. */
export const verifyStorePurchase = (body: {
  provider: "bazaar" | "myket";
  sku: string;
  purchaseToken: string;
  orderId?: string;
}) => authorizedRequest<Entitlement>("/billing/verify", { method: "POST", body: JSON.stringify(body) });

export const startWebCheckout = (planId: string) =>
  authorizedRequest<{ url: string; authority: string }>("/billing/zarinpal/checkout", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
