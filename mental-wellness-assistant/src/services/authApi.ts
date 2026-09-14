import { publicRequest } from "@/services/apiClient";
import { clearTokens, saveTokens } from "@/services/tokenStorage";

interface RequestOtpResponse {
  ok: true;
  phone: string;
  expiresInMin: number;
  devCode?: string; // only present outside production, for local testing
}

/** Requests a login code for the given phone number. Returns the
 *  server-normalized phone (e.g. "0912..." -> "+98912...") and, only in
 *  the backend's non-production mode, the code itself for local testing
 *  without a real SMS provider configured. */
export const requestOtp = (phone: string): Promise<RequestOtpResponse> =>
  publicRequest<RequestOtpResponse>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });

interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; phone: string };
}

/** Verifies the code and stores the resulting tokens on success. */
export const verifyOtp = async (phone: string, code: string): Promise<{ phone: string }> => {
  const res = await publicRequest<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  await saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken, phone: res.user.phone });
  return { phone: res.user.phone };
};

export const logout = async (): Promise<void> => {
  await clearTokens();
};
