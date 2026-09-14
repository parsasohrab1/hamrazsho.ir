import { ApiError, SessionExpiredError, authorizedRequest, publicRequest } from "@/services/apiClient";
import { clearTokens, loadTokens, saveTokens } from "@/services/tokenStorage";

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

const mockFetch = (impl: jest.Mock) => {
  global.fetch = impl as unknown as typeof fetch;
};

beforeEach(async () => {
  await clearTokens();
});

describe("publicRequest", () => {
  it("returns parsed JSON on a successful response", async () => {
    mockFetch(jest.fn(async () => jsonResponse(200, { ok: true, phone: "+989121234567" })));
    const res = await publicRequest<{ ok: boolean }>("/auth/request-otp", { method: "POST" });
    expect(res).toEqual({ ok: true, phone: "+989121234567" });
  });

  it("throws ApiError carrying the server's message on failure", async () => {
    mockFetch(jest.fn(async () => jsonResponse(400, { error: "Phone number doesn't look valid" })));
    await expect(publicRequest("/auth/request-otp", { method: "POST" })).rejects.toThrow(
      "Phone number doesn't look valid"
    );
  });
});

describe("authorizedRequest", () => {
  it("throws SessionExpiredError when there is no stored session", async () => {
    await expect(authorizedRequest("/data")).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("succeeds directly when the access token is still valid", async () => {
    await saveTokens({ accessToken: "valid-token", refreshToken: "refresh-token", phone: "+989121234567" });
    mockFetch(jest.fn(async () => jsonResponse(200, { data: [] })));
    const res = await authorizedRequest("/data");
    expect(res).toEqual({ data: [] });
  });

  it("refreshes once on a 401 and retries with the new access token", async () => {
    await saveTokens({ accessToken: "expired-token", refreshToken: "refresh-token", phone: "+989121234567" });

    const calls: string[] = [];
    mockFetch(
      jest.fn(async (url: string, init?: RequestInit) => {
        calls.push(url);
        if (url.endsWith("/data")) {
          const auth = (init?.headers as Record<string, string>)?.Authorization;
          if (auth === "Bearer expired-token") return jsonResponse(401, { error: "Invalid or expired access token" });
          if (auth === "Bearer new-token") return jsonResponse(200, { data: [{ key: "k", value: 1 }] });
        }
        if (url.endsWith("/auth/refresh")) {
          return jsonResponse(200, { accessToken: "new-token", refreshToken: "new-refresh-token" });
        }
        throw new Error(`Unexpected fetch call: ${url}`);
      })
    );

    const res = await authorizedRequest<{ data: unknown[] }>("/data");
    expect(res).toEqual({ data: [{ key: "k", value: 1 }] });
    expect(calls).toEqual([expect.stringContaining("/data"), expect.stringContaining("/auth/refresh"), expect.stringContaining("/data")]);
    expect((await loadTokens())?.accessToken).toBe("new-token");
  });

  it("clears tokens and throws SessionExpiredError when the refresh token itself is invalid", async () => {
    await saveTokens({ accessToken: "expired-token", refreshToken: "dead-refresh-token", phone: "+989121234567" });
    mockFetch(
      jest.fn(async (url: string) => {
        if (url.endsWith("/data")) return jsonResponse(401, { error: "Invalid or expired access token" });
        if (url.endsWith("/auth/refresh")) return jsonResponse(401, { error: "Invalid or expired refresh token" });
        throw new Error(`Unexpected fetch call: ${url}`);
      })
    );

    await expect(authorizedRequest("/data")).rejects.toBeInstanceOf(SessionExpiredError);
    expect(await loadTokens()).toBeNull();
  });
});

describe("ApiError", () => {
  it("carries the HTTP status", () => {
    const err = new ApiError(404, "not found");
    expect(err.status).toBe(404);
    expect(err.message).toBe("not found");
  });
});
