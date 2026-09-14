import AsyncStorage from "@react-native-async-storage/async-storage";
import * as syncStorage from "@/services/syncStorage";
import { clearTokens, saveTokens } from "@/services/tokenStorage";

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(async () => {
  await clearTokens();
  await AsyncStorage.clear();
});

describe("getItem/setItem/removeItem when logged out", () => {
  it("read/write locally without ever calling fetch", async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    await syncStorage.setItem("mind_companion_mood_log_v1", JSON.stringify([{ mood: "ok" }]));
    expect(await syncStorage.getItem("mind_companion_mood_log_v1")).toBe(JSON.stringify([{ mood: "ok" }]));

    await syncStorage.removeItem("mind_companion_mood_log_v1");
    expect(await syncStorage.getItem("mind_companion_mood_log_v1")).toBeNull();

    await flushMicrotasks();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("setItem when logged in", () => {
  it("persists locally first, then best-effort pushes to the backend", async () => {
    await saveTokens({ accessToken: "token", refreshToken: "refresh", phone: "+989121234567" });
    const fetchSpy = jest.fn(async () => jsonResponse(200, { key: "mind_companion_mood_log_v1", value: [] }));
    global.fetch = fetchSpy as unknown as typeof fetch;

    await syncStorage.setItem("mind_companion_mood_log_v1", JSON.stringify([{ mood: "ok" }]));
    // Local write is synchronous with the awaited call — readable immediately.
    expect(await syncStorage.getItem("mind_companion_mood_log_v1")).toBe(JSON.stringify([{ mood: "ok" }]));

    await flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/data/mind_companion_mood_log_v1"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("never throws even if the backend push fails", async () => {
    await saveTokens({ accessToken: "token", refreshToken: "refresh", phone: "+989121234567" });
    global.fetch = jest.fn(async () => jsonResponse(500, { error: "boom" })) as unknown as typeof fetch;

    await expect(syncStorage.setItem("mind_companion_mood_log_v1", "[]")).resolves.toBeUndefined();
  });
});

describe("fullSyncOnLogin", () => {
  it("pushes existing local keys then overwrites local storage with the server's values", async () => {
    await saveTokens({ accessToken: "token", refreshToken: "refresh", phone: "+989121234567" });
    await AsyncStorage.setItem("mind_companion_mood_log_v1", JSON.stringify([{ mood: "local" }]));

    const putCalls: string[] = [];
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        putCalls.push(url);
        return jsonResponse(200, {});
      }
      if (url.endsWith("/data")) {
        return jsonResponse(200, {
          data: [
            { key: "mind_companion_mood_log_v1", value: [{ mood: "from-server" }] },
            { key: "mind_companion_quick_contacts_v1", value: [] },
          ],
        });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as unknown as typeof fetch;

    await syncStorage.fullSyncOnLogin();

    expect(putCalls).toEqual([expect.stringContaining("/data/mind_companion_mood_log_v1")]);
    expect(await AsyncStorage.getItem("mind_companion_mood_log_v1")).toBe(JSON.stringify([{ mood: "from-server" }]));
    expect(await AsyncStorage.getItem("mind_companion_quick_contacts_v1")).toBe(JSON.stringify([]));
  });
});
