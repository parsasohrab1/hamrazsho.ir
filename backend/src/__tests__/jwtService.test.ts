import { InvalidTokenError, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "@/services/jwtService";

describe("access tokens", () => {
  it("round-trips the userId through sign/verify", () => {
    const token = signAccessToken("user-123");
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-123");
    expect(payload.type).toBe("access");
  });

  it("rejects a refresh token passed as an access token", () => {
    const token = signRefreshToken("user-123");
    expect(() => verifyAccessToken(token)).toThrow(InvalidTokenError);
  });

  it("rejects a garbage token", () => {
    expect(() => verifyAccessToken("not-a-real-token")).toThrow(InvalidTokenError);
  });
});

describe("refresh tokens", () => {
  it("round-trips the userId through sign/verify", () => {
    const token = signRefreshToken("user-456");
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe("user-456");
    expect(payload.type).toBe("refresh");
  });

  it("rejects an access token passed as a refresh token", () => {
    const token = signAccessToken("user-456");
    expect(() => verifyRefreshToken(token)).toThrow(InvalidTokenError);
  });
});
