import { env } from "@/lib/env";

/**
 * Pluggable SMS delivery — same honesty pattern used throughout the
 * client app (see mental-wellness-assistant/src/engine/*Engine.ts real-
 * automation stubs): a working local/dev provider, plus a documented
 * extension point for a real provider that this scaffold does not (and
 * cannot, without real credentials) fake.
 */
export interface SmsProvider {
  id: string;
  sendOtp(phone: string, code: string): Promise<void>;
}

/** Dev-only: never actually sends anything. Logs the code to the server
 *  console so a developer can complete the login flow locally. Callers
 *  (routes/auth.ts) additionally echo the code back in the HTTP response
 *  when NODE_ENV !== "production", purely for local testing. */
export const consoleSmsProvider: SmsProvider = {
  id: "console",
  sendOtp: async (phone, code) => {
    console.log(`[dev SMS] OTP for ${phone}: ${code}`);
  },
};

/** Real delivery via Kavenegar (https://kavenegar.com) — a common choice
 *  for Iranian phone numbers. Requires KAVENEGAR_API_KEY (and ideally
 *  KAVENEGAR_SENDER_LINE) to be set; refuses to pretend to send
 *  otherwise. This function makes the actual HTTPS call — wire your real
 *  API key in .env to use it. */
export const kavenegarSmsProvider: SmsProvider = {
  id: "kavenegar",
  sendOtp: async (phone, code) => {
    if (!env.kavenegarApiKey) {
      throw new Error(
        "SMS_PROVIDER=kavenegar but KAVENEGAR_API_KEY is not set. Sign up at https://kavenegar.com, " +
          "get an API key, and set it in .env — this app will not silently fall back to fake-sending an OTP."
      );
    }
    const params = new URLSearchParams({
      receptor: phone,
      token: code,
      template: "yavar-otp",
    });
    const url = `https://api.kavenegar.com/v1/${env.kavenegarApiKey}/verify/lookup.json?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Kavenegar OTP send failed: ${res.status} ${body}`);
    }
  },
};

export const getSmsProvider = (): SmsProvider =>
  env.smsProvider === "kavenegar" ? kavenegarSmsProvider : consoleSmsProvider;
