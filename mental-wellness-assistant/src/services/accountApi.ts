import AsyncStorage from "@react-native-async-storage/async-storage";
import { authorizedRequest } from "@/services/apiClient";
import { clearTokens } from "@/services/tokenStorage";

/** Everything the server holds about this user (GET /account/export). */
export const exportAccountData = () => authorizedRequest<unknown>("/account/export");

/** Permanently delete the server account, then sign out locally. */
export const deleteAccount = async (): Promise<void> => {
  await authorizedRequest<{ ok: true }>("/account", { method: "DELETE" });
  await clearTokens();
};

/** Wipe everything this app stored on this device except the consent
 *  record (so the user isn't dumped back into onboarding mid-action). */
export const clearLocalData = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k !== "hamraz_consent_v1"));
};
