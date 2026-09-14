/** Sync-store keys mirror the client's AsyncStorage keys (see
 *  mental-wellness-assistant/src/state/use*.ts), which all follow the
 *  pattern `mind_companion_<feature>_v<N>`. We don't hardcode the exact
 *  list here (new client features add new keys over time without a
 *  backend deploy), just a safe general shape. */
const KEY_PATTERN = /^[a-zA-Z0-9_]{1,128}$/;

export const isValidDataKey = (key: string): boolean => KEY_PATTERN.test(key);

/** Generous but bounded — this store is for small JSON blobs (profiles,
 *  logs, contact lists), not file storage (see the separate /files API). */
export const MAX_VALUE_BYTES = 256 * 1024;

export const isValueWithinSizeLimit = (value: unknown): boolean =>
  Buffer.byteLength(JSON.stringify(value), "utf8") <= MAX_VALUE_BYTES;
