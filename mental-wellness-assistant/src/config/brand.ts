import * as brandModule from "./brandConfig.json";

/**
 * Single source of truth for everything brand-related that appears in the
 * UI. The product is going to be renamed — when that happens, edit
 * brandConfig.json (plus the icon files in assets/) and nothing else. No screen
 * hardcodes the product name.
 *
 * The values live in JSON (not here) because app.config.ts also reads
 * them for the store-visible app name, and Expo's config loader can't
 * import TypeScript modules — so the launcher label and the in-app name
 * can never drift apart.
 *
 * `legalEntityName` MUST be filled in before release — it appears in the
 * privacy policy and terms (see store/LAUNCH-CHECKLIST.md).
 */
type Brand = typeof import("./brandConfig.json");
// Namespace import + default fallback works under Metro/Babel, Jest and
// plain ts-node (scripts/) alike, regardless of JSON interop settings.
export const BRAND: Brand = (brandModule as unknown as { default?: Brand }).default ?? (brandModule as Brand);
