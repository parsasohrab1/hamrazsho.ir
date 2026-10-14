import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { Locale, NarrationStyle, VoiceService } from "@/types";

/**
 * Cross-platform voice abstraction.
 *
 * TTS ("speak"): expo-speech works on iOS, Android *and* web (it wraps
 * window.speechSynthesis there), so it's used unconditionally.
 *
 * STT ("listen"):
 *   - web: the browser's Web Speech API (Chrome/Edge support it;
 *     Safari/Firefox may not — isListeningSupported() reports that
 *     honestly).
 *   - iOS/Android: `expo-speech-recognition`, which wraps the platform
 *     recognizer (Android SpeechRecognizer / iOS SFSpeechRecognizer). It is
 *     a native module, so it only exists in real builds (EAS/dev client) —
 *     in Expo Go or on a phone with no recognition service installed (some
 *     Android phones sold without Google services), isListeningSupported()
 *     returns false and the UI falls back to typing, per the product
 *     requirement that voice must never be a hard dependency.
 *   Both platform recognizers may send audio to the OS vendor's servers
 *   for Persian; this is disclosed in the privacy policy.
 */

const speechLang = (locale: Locale = "fa"): string => (locale === "fa" ? "fa-IR" : "en-US");

/* ---- Assistant voice gender -------------------------------------------
 * The assistant's voice is female or male per the user's voice profile
 * (src/state/useVoiceProfile.ts: female for men, male for women by
 * default, or the user's explicit choice). Neither expo-speech nor the Web
 * Speech API exposes a reliable "gender" field, so voices are matched by
 * the naming patterns TTS engines use. Many phones ship only ONE Persian
 * voice; when no voice of the wanted gender exists we fall back to the
 * available one with an adjusted pitch — an approximation, stated here
 * rather than pretended away.
 */
type VoiceGender = "female" | "male";
let assistantGender: VoiceGender = "female";
export const setAssistantVoiceGender = (g: VoiceGender) => {
  assistantGender = g;
};

const MALE_VOICE_NAME_HINTS = [
  "male",
  "man",
  "daniel",
  "alex",
  "fred",
  "david",
  "mark",
  "george",
  "james",
  "matthew",
  "joey",
  "justin",
  "#male",
  "علی",
  "فرید",
  "رضا",
];

const voiceCache: Partial<Record<string, { id?: string; exact: boolean }>> = {};

/** Best voice for `gender` in `locale`; `exact` = its name actually
 *  matched the gender (otherwise the pitch fallback kicks in). */
const pickVoice = async (locale: Locale, gender: VoiceGender): Promise<{ id?: string; exact: boolean }> => {
  const key = `${locale}:${gender}`;
  if (voiceCache[key]) return voiceCache[key]!;
  let result: { id?: string; exact: boolean } = { exact: false };
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (voices?.length) {
      const wantLang = locale === "fa" ? "fa" : "en";
      const localeVoices = voices.filter((v) => v.language?.toLowerCase().startsWith(wantLang));
      const pool = localeVoices.length > 0 ? localeVoices : voices;
      const matches = (v: (typeof pool)[number], hints: string[]) =>
        hints.some((h) => v.name?.toLowerCase().includes(h) || v.identifier?.toLowerCase().includes(h));
      // "female" contains "male" — check female first and exclude it for male.
      const isFemale = (v: (typeof pool)[number]) => matches(v, FEMALE_VOICE_NAME_HINTS);
      const found =
        gender === "female"
          ? pool.find(isFemale)
          : pool.find((v) => !isFemale(v) && matches(v, MALE_VOICE_NAME_HINTS));
      result = found ? { id: found.identifier, exact: true } : { id: pool[0]?.identifier, exact: false };
    }
  } catch {
    // no voice list — platform default voice
  }
  voiceCache[key] = result;
  return result;
};

/** Pitch/rate for the assistant's everyday voice. */
const voiceTuning = (gender: VoiceGender, exact: boolean) =>
  gender === "male" ? { pitch: exact ? 1.0 : 0.72, rate: 0.95 } : { pitch: exact ? 1.0 : 1.08, rate: 0.95 };

/* ---- Friendly section intros ------------------------------------------
 * When the user opens a section, RootNavigator queues a short casual line
 * ("خب، بریم سراغ آشپزی!"). If the screen speaks its own first sentence
 * right away, the intro is prepended to it (one smooth utterance instead of
 * the screen cutting the intro off); otherwise the intro is spoken alone
 * after a short delay.
 */
let pendingIntro: string | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

export const queueIntro = (text: string, locale: Locale = "fa") => {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingIntro = text;
  pendingTimer = setTimeout(() => {
    const t = pendingIntro;
    pendingIntro = null;
    pendingTimer = null;
    if (t) speakRaw(t, locale);
  }, 900);
};

const takeIntro = (): string | null => {
  const t = pendingIntro;
  pendingIntro = null;
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  return t;
};

const speakRaw = async (text: string, locale: Locale = "fa"): Promise<void> => {
  await Speech.stop();
  const { id, exact } = await pickVoice(locale, assistantGender);
  const { pitch, rate } = voiceTuning(assistantGender, exact);
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: speechLang(locale),
      voice: id,
      pitch,
      rate,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
};

const speak = async (text: string, locale: Locale = "fa"): Promise<void> => {
  const intro = takeIntro();
  return speakRaw(intro ? `${intro} ${text}` : text, locale);
};

const stopSpeaking = async (): Promise<void> => {
  takeIntro();
  await Speech.stop();
};

/**
 * Best-effort female-voice picker for the storytelling feature. Neither
 * expo-speech nor the Web Speech API exposes a reliable cross-platform
 * "gender" field, so this matches common naming patterns used by iOS,
 * Android, and browser TTS engines for their female voices (e.g.
 * "Samantha", "Zira", "Google fa-IR Female"). It's a heuristic, not a
 * guarantee — some devices only ship one voice per language, in which
 * case this quietly falls back to whatever is available.
 */
const FEMALE_VOICE_NAME_HINTS = [
  "female",
  "woman",
  "samantha",
  "victoria",
  "karen",
  "susan",
  "moira",
  "tessa",
  "fiona",
  "zira",
  "salli",
  "joanna",
  "kendra",
  "kimberly",
  "ava",
  "allison",
  "زهرا",
  "نازنین",
];

const pickFemaleVoiceId = async (locale: Locale): Promise<string | undefined> => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (!voices?.length) return undefined;
    const wantLang = locale === "fa" ? "fa" : "en";
    const localeVoices = voices.filter((v) => v.language?.toLowerCase().startsWith(wantLang));
    const pool = localeVoices.length > 0 ? localeVoices : voices;
    const female = pool.find((v) =>
      FEMALE_VOICE_NAME_HINTS.some((hint) => v.name?.toLowerCase().includes(hint) || v.identifier?.toLowerCase().includes(hint))
    );
    return (female ?? pool[0])?.identifier;
  } catch {
    return undefined;
  }
};

/**
 * Narrates a children's story in a female-leaning voice (best effort —
 * see pickFemaleVoiceId) with one of two paces:
 *  - "motherly": warmer, slower, slightly higher-pitched
 *  - "normal": a plain, everyday narration pace
 */
const speakStory = async (text: string, locale: Locale, style: NarrationStyle): Promise<void> => {
  await Speech.stop();
  const voice = await pickFemaleVoiceId(locale);
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: speechLang(locale),
      voice,
      pitch: style === "motherly" ? 1.15 : 1.0,
      rate: style === "motherly" ? 0.82 : 0.95,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
};

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

const getWebSpeechRecognitionCtor = (): (new () => WebSpeechRecognition) | null => {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

type NativeSpeechModule = typeof import("expo-speech-recognition");

/** Lazy + guarded: the native module is missing in Expo Go and in Jest. */
let nativeSpeech: NativeSpeechModule | null | undefined;
const getNativeSpeech = (): NativeSpeechModule | null => {
  if (Platform.OS === "web") return null;
  if (nativeSpeech !== undefined) return nativeSpeech;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod: NativeSpeechModule = require("expo-speech-recognition");
    nativeSpeech = mod.isRecognitionAvailable() ? mod : null;
  } catch {
    nativeSpeech = null;
  }
  return nativeSpeech;
};

let nativeListening = false;

const listenNative = async (mod: NativeSpeechModule, locale: Locale): Promise<string> => {
  const perm = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!perm.granted) throw new Error("microphone_permission_denied");
  return new Promise((resolve, reject) => {
    let transcript = "";
    const subs = [
      mod.addSpeechRecognitionListener("result", (ev) => {
        const t = ev.results?.[0]?.transcript;
        if (t) transcript = t;
      }),
      mod.addSpeechRecognitionListener("error", (ev) => {
        cleanup();
        // "no-speech" just means silence — treat as an empty answer, not a failure.
        if (ev.error === "no-speech" || ev.error === "speech-timeout") resolve("");
        else reject(new Error(ev.error ?? "speech_recognition_error"));
      }),
      mod.addSpeechRecognitionListener("end", () => {
        cleanup();
        resolve(transcript);
      }),
    ];
    const cleanup = () => {
      nativeListening = false;
      subs.forEach((s) => s.remove());
    };
    nativeListening = true;
    mod.ExpoSpeechRecognitionModule.start({
      lang: speechLang(locale),
      interimResults: false,
      maxAlternatives: 1,
      continuous: false,
    });
  });
};

let activeRecognition: WebSpeechRecognition | null = null;

const isListeningSupported = (): boolean => getWebSpeechRecognitionCtor() !== null || getNativeSpeech() !== null;

const listen = (): Promise<string> => {
  const native = getNativeSpeech();
  if (native) return listenNative(native, "fa");
  const Ctor = getWebSpeechRecognitionCtor();
  if (!Ctor) {
    return Promise.reject(
      new Error(
        "Speech-to-text is not available on this platform/browser. Use the typed input instead."
      )
    );
  }
  return new Promise((resolve, reject) => {
    const recognition = new Ctor();
    recognition.lang = "fa-IR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    activeRecognition = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript ?? "";
      resolve(transcript);
    };
    recognition.onerror = (event: any) => {
      reject(new Error(event?.error ?? "speech_recognition_error"));
    };
    recognition.onend = () => {
      activeRecognition = null;
    };
    recognition.start();
  });
};

const stopListening = (): void => {
  if (nativeListening) getNativeSpeech()?.ExpoSpeechRecognitionModule.stop();
  activeRecognition?.stop();
  activeRecognition = null;
};

export const voiceService: VoiceService = {
  speak,
  stopSpeaking,
  isListeningSupported,
  listen,
  stopListening,
};

/** Not part of the core VoiceService interface (which stays generic) —
 *  a dedicated export for the storytelling feature's voice/pace needs. */
export { speakStory };
