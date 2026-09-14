/**
 * Base URL of the Yavar backend (see ../../backend). Not hardcoded to a
 * single value on purpose: "localhost" only resolves to the backend when
 * both run on the exact same machine (web/simulator dev) — a phone on a
 * real device needs your computer's LAN IP or a deployed URL instead.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in a .env file (Expo inlines EXPO_PUBLIC_*
 * vars at build time) to point at your backend, e.g.:
 *   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:4000
 * or, once deployed:
 *   EXPO_PUBLIC_API_BASE_URL=https://api.yavar.example
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** True once a real base URL has been configured — used to decide whether
 *  to even attempt network calls (login, sync) instead of failing loudly
 *  every time on an unconfigured dev setup. */
export const isBackendConfigured = (): boolean => Boolean(process.env.EXPO_PUBLIC_API_BASE_URL);
