import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREMIUM_MODE } from "@/config/release";
import { PLANS, PlanId, planById } from "@/billing/plans";
import { getStoreBilling, PurchaseCancelledError } from "@/billing/storeBilling";
import { Entitlement, getEntitlement } from "@/services/billingApi";
import { isBackendConfigured } from "@/services/apiConfig";
import { useAuth } from "@/state/AuthContext";

/** Local cache so premium works offline between launches. It is only a
 *  cache of what the server said — it expires on its own `expiresAt`, and
 *  is overwritten on every successful refresh. Not a synced key. */
const CACHE_KEY = "hamraz_entitlement_cache_v1";

const NONE: Entitlement = { premium: false, expiresAt: null, provider: null, planId: null, autoRenewing: false };

export class LoginRequiredError extends Error {}

export const isEntitlementActive = (e: Entitlement | null, now: Date = new Date()): boolean =>
  Boolean(e?.premium && e.expiresAt && new Date(e.expiresAt).getTime() > now.getTime());

interface PremiumApi {
  isPremium: boolean;
  entitlement: Entitlement;
  busy: boolean;
  refresh: () => Promise<void>;
  /** Resolves true when premium is active afterwards, false if the user
   *  cancelled or was redirected (web). Throws LoginRequiredError. */
  purchase: (planId: PlanId) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumApi | null>(null);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [entitlement, setEntitlement] = useState<Entitlement>(NONE);
  const [busy, setBusy] = useState(false);

  const store = useCallback(async (e: Entitlement) => {
    setEntitlement(e);
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(e));
    } catch {
      // best effort
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) setEntitlement(JSON.parse(raw));
      } catch {
        // ignore a corrupt cache
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    if (!isBackendConfigured() || !isLoggedIn) return;
    try {
      await store(await getEntitlement());
    } catch {
      // Offline: keep the cached value until it expires on its own.
    }
  }, [isLoggedIn, store]);

  // Refresh on login/logout; clear the cache on logout so a shared device
  // doesn't keep the previous user's premium.
  useEffect(() => {
    if (isLoggedIn === false) {
      store(NONE);
      return;
    }
    if (isLoggedIn) refresh();
  }, [isLoggedIn, refresh, store]);

  // Web: Zarinpal sends the browser back to /?payment=success.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment")) refresh();
  }, [refresh]);

  const purchase = useCallback(
    async (planId: PlanId) => {
      if (!isLoggedIn) throw new LoginRequiredError();
      setBusy(true);
      try {
        const res = await getStoreBilling().purchase(planById(planId));
        if (res === "redirect") return false;
        await store(res);
        return isEntitlementActive(res);
      } catch (e) {
        if (e instanceof PurchaseCancelledError) return false;
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [isLoggedIn, store]
  );

  const restore = useCallback(async () => {
    if (!isLoggedIn) throw new LoginRequiredError();
    setBusy(true);
    try {
      const fromStore = await getStoreBilling().restore(PLANS);
      const latest = fromStore ?? (await getEntitlement());
      await store(latest);
      return isEntitlementActive(latest);
    } finally {
      setBusy(false);
    }
  }, [isLoggedIn, store]);

  const isPremium = PREMIUM_MODE === "unlocked" || isEntitlementActive(entitlement);

  const value = useMemo(
    () => ({ isPremium, entitlement, busy, refresh, purchase, restore }),
    [isPremium, entitlement, busy, refresh, purchase, restore]
  );
  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremium = (): PremiumApi => {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within a PremiumProvider");
  return ctx;
};
