import "dotenv/config";

const required = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required environment variable: ${name}`);
  return v;
};

const int = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`Environment variable ${name} must be a number, got "${raw}"`);
  return n;
};

export const env = {
  port: int("PORT", 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",

  databaseUrl: required("DATABASE_URL"),

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessTtlMin: int("JWT_ACCESS_TTL_MIN", 15),
  jwtRefreshTtlDays: int("JWT_REFRESH_TTL_DAYS", 30),

  otpTtlMin: int("OTP_TTL_MIN", 5),
  otpMaxAttempts: int("OTP_MAX_ATTEMPTS", 5),
  otpRequestCooldownSec: int("OTP_REQUEST_COOLDOWN_SEC", 60),

  smsProvider: (process.env.SMS_PROVIDER ?? "console") as "console" | "kavenegar",
  kavenegarApiKey: process.env.KAVENEGAR_API_KEY ?? "",
  kavenegarSenderLine: process.env.KAVENEGAR_SENDER_LINE ?? "",

  storageProvider: (process.env.STORAGE_PROVIDER ?? "local") as "local" | "s3",
  uploadsDir: process.env.UPLOADS_DIR ?? "./uploads",
  maxUploadMb: int("MAX_UPLOAD_MB", 8),
};

if (env.isProduction) {
  const usingPlaceholder =
    env.jwtAccessSecret.startsWith("dev_only_") || env.jwtRefreshSecret.startsWith("dev_only_");
  if (usingPlaceholder) {
    throw new Error(
      "Refusing to start in production with a placeholder JWT secret. Set JWT_ACCESS_SECRET and " +
        "JWT_REFRESH_SECRET to real random values (e.g. `openssl rand -hex 32`)."
    );
  }
}
