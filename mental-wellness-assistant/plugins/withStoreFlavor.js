/**
 * Per-store Android manifest adjustments, driven by EXPO_PUBLIC_STORE.
 *
 * Iranian stores reject APKs that declare another store's billing
 * permission, and Google Play rejects APKs that route payments through a
 * third-party store. Poolakey's own manifest declares Bazaar's
 * permission/queries, so for every non-Bazaar flavor we strip them here
 * (the native library itself is also unlinked — see react-native.config.js).
 */
const { withAndroidManifest } = require("expo/config-plugins");

const BAZAAR_MARKERS = ["com.farsitel.bazaar"];

module.exports = function withStoreFlavor(config) {
  const store = process.env.EXPO_PUBLIC_STORE || "dev";
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";
    if (store !== "bazaar") {
      manifest["uses-permission"] = manifest["uses-permission"] || [];
      // Merge-time removal of anything a library manifest would add back.
      manifest["uses-permission"].push({
        $: { "android:name": "com.farsitel.bazaar.permission.PAY_THROUGH_BAZAAR", "tools:node": "remove" },
      });
      if (Array.isArray(manifest.queries)) {
        manifest.queries = manifest.queries.filter(
          (q) => !JSON.stringify(q).includes(BAZAAR_MARKERS[0])
        );
      }
    }
    return cfg;
  });
};
