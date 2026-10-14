import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAssistantVoiceGender } from "@/voice/voiceService";

/**
 * Who the assistant is talking to, and which voice it should use.
 *
 * Product rule: by default the assistant speaks with a female voice to men
 * and a male voice to women. The user can always override this and pick
 * the voice they're comfortable with ("female" / "male") — that's how a
 * same-gender voice is chosen. We deliberately do NOT try to infer a user's
 * sexual orientation from what they say: that would mean the app guessing
 * and storing highly sensitive data about someone without asking, which is
 * a real safety risk for users. An explicit choice gives the same result
 * with none of that risk.
 *
 * Stored only on this device (not a synced key).
 */
export type UserGender = "male" | "female" | "unspecified";
export type VoicePreference = "auto" | "female" | "male";
export type VoiceGender = "female" | "male";

export interface VoiceProfile {
  name: string;
  userGender: UserGender;
  voicePref: VoicePreference;
}

const KEY = "hamraz_voice_profile_v1";

export const DEFAULT_VOICE_PROFILE: VoiceProfile = { name: "", userGender: "unspecified", voicePref: "auto" };

export const resolveVoiceGender = (p: VoiceProfile): VoiceGender => {
  if (p.voicePref !== "auto") return p.voicePref;
  if (p.userGender === "female") return "male";
  return "female";
};

let cached: VoiceProfile = DEFAULT_VOICE_PROFILE;
const listeners = new Set<(p: VoiceProfile) => void>();

const apply = (p: VoiceProfile) => {
  cached = p;
  setAssistantVoiceGender(resolveVoiceGender(p));
  listeners.forEach((l) => l(p));
};

/** Load once at startup (App.tsx) so the very first spoken line already
 *  uses the right voice. */
export const loadVoiceProfile = async (): Promise<VoiceProfile> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    apply(raw ? { ...DEFAULT_VOICE_PROFILE, ...JSON.parse(raw) } : DEFAULT_VOICE_PROFILE);
  } catch {
    apply(DEFAULT_VOICE_PROFILE);
  }
  return cached;
};

export const saveVoiceProfile = async (p: VoiceProfile): Promise<void> => {
  apply(p);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // best effort
  }
};

export const useVoiceProfile = () => {
  const [profile, setProfile] = useState<VoiceProfile>(cached);
  useEffect(() => {
    listeners.add(setProfile);
    return () => {
      listeners.delete(setProfile);
    };
  }, []);
  const update = useCallback((patch: Partial<VoiceProfile>) => saveVoiceProfile({ ...cached, ...patch }), []);
  return { profile, update };
};
