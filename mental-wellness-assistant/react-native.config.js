/**
 * Link each store's native billing SDK only into that store's build.
 * EXPO_PUBLIC_STORE is set per build profile in eas.json.
 */
const store = process.env.EXPO_PUBLIC_STORE || "dev";
const unlink = { platforms: { android: null, ios: null } };

module.exports = {
  dependencies: {
    "@cafebazaar/react-native-poolakey": store === "bazaar" ? {} : unlink,
  },
};
