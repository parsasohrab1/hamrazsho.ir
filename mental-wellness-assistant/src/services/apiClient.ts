import { API_BASE_URL } from "@/services/apiConfig";
import { clearTokens, loadTokens, saveTokens } from "@/services/tokenStorage";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Thrown when the refresh token itself is invalid/expired — the caller
 *  should treat this as "logged out" and clear any auth UI state. */
export class SessionExpiredError extends Error {}

const parseErrorMessage = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    return typeof body?.error === "string" ? body.error : `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

/** Unauthenticated request — used for /auth/request-otp, /auth/verify-otp. */
export const publicRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json();
};

const refreshAccessToken = async (): Promise<string> => {
  const tokens = await loadTokens();
  if (!tokens) throw new SessionExpiredError();

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  if (!res.ok) {
    await clearTokens();
    throw new SessionExpiredError();
  }
  const { accessToken, refreshToken } = await res.json();
  await saveTokens({ ...tokens, accessToken, refreshToken });
  return accessToken;
};

/** Authenticated request — attaches the stored access token and, on a 401,
 *  refreshes once and retries before giving up. */
export const authorizedRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const tokens = await loadTokens();
  if (!tokens) throw new SessionExpiredError();

  const doFetch = async (accessToken: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    });

  let res = await doFetch(tokens.accessToken);
  if (res.status === 401) {
    const newAccessToken = await refreshAccessToken();
    res = await doFetch(newAccessToken);
  }
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json();
};
