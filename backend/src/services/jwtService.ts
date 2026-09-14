import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export interface AccessTokenPayload {
  sub: string; // userId
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string; // userId
  type: "refresh";
}

export const signAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId, type: "access" } satisfies AccessTokenPayload, env.jwtAccessSecret, {
    expiresIn: `${env.jwtAccessTtlMin}m`,
  });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId, type: "refresh" } satisfies RefreshTokenPayload, env.jwtRefreshSecret, {
    expiresIn: `${env.jwtRefreshTtlDays}d`,
  });

export class InvalidTokenError extends Error {
  status = 401;
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
    if (decoded.type !== "access") throw new Error("not an access token");
    return decoded;
  } catch {
    throw new InvalidTokenError("Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
    if (decoded.type !== "refresh") throw new Error("not a refresh token");
    return decoded;
  } catch {
    throw new InvalidTokenError("Invalid or expired refresh token");
  }
};
