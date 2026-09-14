import { clearTokens, loadTokens, saveTokens } from "@/services/tokenStorage";

describe("tokenStorage", () => {
  it("returns null when nothing is stored", async () => {
    expect(await loadTokens()).toBeNull();
  });

  it("round-trips saved tokens", async () => {
    await saveTokens({ accessToken: "a1", refreshToken: "r1", phone: "+989121234567" });
    expect(await loadTokens()).toEqual({ accessToken: "a1", refreshToken: "r1", phone: "+989121234567" });
  });

  it("clears stored tokens", async () => {
    await saveTokens({ accessToken: "a1", refreshToken: "r1", phone: "+989121234567" });
    await clearTokens();
    expect(await loadTokens()).toBeNull();
  });
});
