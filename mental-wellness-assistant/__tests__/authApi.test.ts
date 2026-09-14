import { logout, requestOtp, verifyOtp } from "@/services/authApi";
import { clearTokens, loadTokens } from "@/services/tokenStorage";

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

beforeEach(async () => {
  await clearTokens();
});

describe("requestOtp", () => {
  it("returns the server's response without storing any tokens", async () => {
    global.fetch = jest.fn(async () =>
      jsonResponse(200, { ok: true, phone: "+989121234567", expiresInMin: 5, devCode: "042917" })
    ) as unknown as typeof fetch;

    const res = await requestOtp("09121234567");
    expect(res).toEqual({ ok: true, phone: "+989121234567", expiresInMin: 5, devCode: "042917" });
    expect(await loadTokens()).toBeNull();
  });
});

describe("verifyOtp", () => {
  it("stores the returned tokens and phone on success", async () => {
    global.fetch = jest.fn(async () =>
      jsonResponse(200, {
        accessToken: "access-1",
        refreshToken: "refresh-1",
        user: { id: "user-1", phone: "+989121234567" },
      })
    ) as unknown as typeof fetch;

    const res = await verifyOtp("09121234567", "042917");
    expect(res).toEqual({ phone: "+989121234567" });
    expect(await loadTokens()).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      phone: "+989121234567",
    });
  });

  it("stores nothing and throws when the code is wrong", async () => {
    global.fetch = jest.fn(async () => jsonResponse(400, { error: "Incorrect code" })) as unknown as typeof fetch;

    await expect(verifyOtp("09121234567", "000000")).rejects.toThrow("Incorrect code");
    expect(await loadTokens()).toBeNull();
  });
});

describe("logout", () => {
  it("clears any stored session", async () => {
    global.fetch = jest.fn(async () =>
      jsonResponse(200, { accessToken: "a", refreshToken: "r", user: { id: "u", phone: "+989121234567" } })
    ) as unknown as typeof fetch;
    await verifyOtp("09121234567", "042917");
    expect(await loadTokens()).not.toBeNull();

    await logout();
    expect(await loadTokens()).toBeNull();
  });
});
