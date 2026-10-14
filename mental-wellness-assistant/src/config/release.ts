/**
 * Which store this binary was built for. Set at build time by eas.json
 * (EXPO_PUBLIC_STORE), because each store requires its own billing SDK and
 * forbids the others' — see react-native.config.js, which also uses this
 * value to link only the matching native billing library.
 */
export type StoreFlavor = "bazaar" | "myket" | "play" | "web" | "dev";

const raw = process.env.EXPO_PUBLIC_STORE;
export const STORE: StoreFlavor =
  raw === "bazaar" || raw === "myket" || raw === "play" || raw === "web" ? raw : "dev";

/**
 * How premium features behave in this build:
 * - "billing": premium features are visible and purchasable.
 * - "hidden": premium features are not shown at all; the build is a clean,
 *   fully free app. Used where we can't take payments yet (Google Play:
 *   Iranian merchants can't receive Play Billing payouts; Myket: the native
 *   billing module is not integrated yet — backend verification is ready).
 * - "unlocked": everything is free (local development).
 */
export type PremiumMode = "billing" | "hidden" | "unlocked";

const PREMIUM_MODE_BY_STORE: Record<StoreFlavor, PremiumMode> = {
  bazaar: "billing",
  // The website is read-only content (see WEB_FULL_APP below); it sells
  // nothing. The Zarinpal backend flow stays available if that changes.
  web: "hidden",
  myket: "hidden",
  play: "hidden",
  dev: "unlocked",
};

const overrideMode = process.env.EXPO_PUBLIC_PREMIUM_MODE;
export const PREMIUM_MODE: PremiumMode =
  overrideMode === "billing" || overrideMode === "hidden" || overrideMode === "unlocked"
    ? overrideMode
    : PREMIUM_MODE_BY_STORE[STORE];

/** Features built on placeholder catalogs (fictional music tracks, fake
 *  lyrics) are demo-only: they stay reachable in dev builds but never ship
 *  to a store build, where paying users would reasonably expect real
 *  content. Override with EXPO_PUBLIC_SHOW_DEMO_FEATURES=true. */
export const SHOW_DEMO_FEATURES =
  process.env.EXPO_PUBLIC_SHOW_DEMO_FEATURES === "true" || STORE === "dev";

/** Cafe Bazaar RSA public key (Pishkhan → in-app billing). Public by
 *  design — it only lets the SDK check purchase signatures. */
export const BAZAAR_RSA_KEY = process.env.EXPO_PUBLIC_BAZAAR_RSA_KEY ?? "";

/** The web build is a read-only showcase: app download links, the
 *  educational content library, emergency numbers and policies — no voice
 *  assistant and no interactive features (product decision: voice and
 *  personalisation live only in the installed app). Set
 *  EXPO_PUBLIC_WEB_FULL_APP=true to run the full app in a browser for
 *  development/testing. */
export const WEB_FULL_APP = process.env.EXPO_PUBLIC_WEB_FULL_APP === "true";
