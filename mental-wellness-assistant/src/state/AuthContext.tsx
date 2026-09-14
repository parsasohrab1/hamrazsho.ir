import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "@/services/authApi";
import { loadTokens } from "@/services/tokenStorage";
import { fullSyncOnLogin } from "@/services/syncStorage";

interface AuthApi {
  /** null while the stored session is still being checked on app start. */
  isLoggedIn: boolean | null;
  phone: string | null;
  syncing: boolean;
  syncError: string | null;
  requestOtp: (phone: string) => Promise<{ expiresInMin: number; devCode?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const tokens = await loadTokens();
      setIsLoggedIn(Boolean(tokens));
      setPhone(tokens?.phone ?? null);
    })();
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await fullSyncOnLogin();
    } catch {
      // Login itself already succeeded; a sync failure (e.g. offline right
      // after login) shouldn't block using the app — surface it, don't throw.
      setSyncError("همگام‌سازی با سرور انجام نشد — داده‌های شما همچنان روی همین گوشی ذخیره‌اند.");
    } finally {
      setSyncing(false);
    }
  }, []);

  const requestOtp = useCallback(async (phoneNumber: string) => {
    const res = await authApi.requestOtp(phoneNumber);
    return { expiresInMin: res.expiresInMin, devCode: res.devCode };
  }, []);

  const verifyOtp = useCallback(
    async (phoneNumber: string, code: string) => {
      const { phone: normalizedPhone } = await authApi.verifyOtp(phoneNumber, code);
      setIsLoggedIn(true);
      setPhone(normalizedPhone);
      runSync();
    },
    [runSync]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setIsLoggedIn(false);
    setPhone(null);
    setSyncError(null);
  }, []);

  const value = useMemo(
    () => ({ isLoggedIn, phone, syncing, syncError, requestOtp, verifyOtp, logout }),
    [isLoggedIn, phone, syncing, syncError, requestOtp, verifyOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthApi => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
