import AsyncStorage from "@react-native-async-storage/async-storage";
import { authorizedRequest } from "@/services/apiClient";
import { loadTokens } from "@/services/tokenStorage";

/** Every AsyncStorage key that opts into cloud sync once the user logs in.
 *  Deliberately NOT every key in the app: wardrobe photos
 *  (mind_companion_wardrobe_v1) store on-device file URIs that would be
 *  meaningless on a different device, so that hook stays local-only for
 *  now (see DISCLAIMERS.styleAdvisorLimitations) — syncing real photo
 *  bytes would need the backend's separate /files upload API, not this
 *  key-value store. */
export const SYNCED_KEYS = [
  "mind_companion_mood_log_v1",
  "mind_companion_quick_contacts_v1",
  "mind_companion_trusted_contact_v1",
  "mind_companion_career_coach_v1",
  "mind_companion_companion_profile_v1",
  "mind_companion_family_circle_v1",
  "mind_companion_favorite_music_profile_v1",
  "mind_companion_quit_coach_v1",
  "mind_companion_active_listening_enabled_v1",
] as const;

const isLoggedIn = async (): Promise<boolean> => Boolean(await loadTokens());

/** Drop-in replacement for AsyncStorage.getItem/setItem/removeItem used by
 *  the state hooks in src/state. Local storage is always the fast,
 *  offline-first source of truth for reads; writes persist locally first
 *  (so the UI never waits on the network) and then best-effort mirror to
 *  the backend when the user is logged in — failures are swallowed here,
 *  same as the pre-existing "best-effort persistence" pattern in every
 *  hook this replaces AsyncStorage in. */
export const getItem = (key: string): Promise<string | null> => AsyncStorage.getItem(key);

export const setItem = async (key: string, value: string): Promise<void> => {
  await AsyncStorage.setItem(key, value);
  pushKey(key, value).catch(() => {});
};

export const removeItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
  deleteKey(key).catch(() => {});
};

const pushKey = async (key: string, value: string): Promise<void> => {
  if (!(await isLoggedIn())) return;
  await authorizedRequest(`/data/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value: JSON.parse(value) }),
  });
};

const deleteKey = async (key: string): Promise<void> => {
  if (!(await isLoggedIn())) return;
  await authorizedRequest(`/data/${encodeURIComponent(key)}`, { method: "DELETE" });
};

/** Call once right after a successful login. Pushes whatever this device
 *  already has locally (so first-time login never loses on-device data),
 *  then pulls the server's current values back down (so a second device,
 *  or data restored after reinstalling, lands back in AsyncStorage).
 *  Simple last-write-wins, no merge — acceptable for this app's small,
 *  mostly single-device-at-a-time data; documented rather than hidden. */
export const fullSyncOnLogin = async (): Promise<void> => {
  await Promise.all(
    SYNCED_KEYS.map(async (key) => {
      const raw = await AsyncStorage.getItem(key);
      if (raw !== null) await pushKey(key, raw).catch(() => {});
    })
  );

  const { data } = await authorizedRequest<{ data: { key: string; value: unknown }[] }>("/data");
  await Promise.all(
    data
      .filter((row) => (SYNCED_KEYS as readonly string[]).includes(row.key))
      .map((row) => AsyncStorage.setItem(row.key, JSON.stringify(row.value)))
  );
};
