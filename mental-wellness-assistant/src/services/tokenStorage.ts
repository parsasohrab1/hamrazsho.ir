import AsyncStorage from "@react-native-async-storage/async-storage";

/** Separate, clearly-namespaced key so a future generic-sync pass over
 *  "mind_companion_*" keys never accidentally touches auth tokens. */
const TOKENS_KEY = "yavar_auth_tokens_v1";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  phone: string;
}

export const loadTokens = async (): Promise<AuthTokens | null> => {
  try {
    const raw = await AsyncStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
};

export const saveTokens = async (tokens: AuthTokens): Promise<void> => {
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
};

export const clearTokens = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKENS_KEY);
};
