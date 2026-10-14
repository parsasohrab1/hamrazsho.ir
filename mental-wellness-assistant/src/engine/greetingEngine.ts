import type { FeatureId } from "@/config/features";

/**
 * The friendly, colloquial ("خودمونی") voice of the assistant: the welcome
 * spoken when the app opens, the one-liners spoken when entering each
 * section, and a keyword router that turns "میخوام یه غذا درست کنم" into
 * the right section. All pre-written — there is no live AI here.
 */

const pick = <T,>(arr: T[], rand: () => number = Math.random): T => arr[Math.floor(rand() * arr.length) % arr.length];

const timeOfDay = (hour: number) =>
  hour < 5 ? "شب‌بخیر" : hour < 12 ? "صبح بخیر" : hour < 17 ? "ظهر بخیر" : hour < 20 ? "عصر بخیر" : "شب‌بخیر";

/** Opening line when the app starts. */
export const welcomeLine = (name: string, now: Date = new Date(), rand: () => number = Math.random): string => {
  const who = name.trim() ? ` ${name.trim()}` : "";
  const hello = pick([`سلام${who}!`, `سلااام${who}!`, `${timeOfDay(now.getHours())}${who}!`, `به‌به، سلام${who}!`], rand);
  const how = pick(["چطوری رفیق؟", "خوبی؟ چه خبرا؟", "دلم برات تنگ شده بود!", "خوش اومدی!"], rand);
  const ask = pick(
    [
      "امروز دوست داری با هم چی کار کنیم؟",
      "بگو ببینم، امروز چی کار کنیم که حالت بهتر شه؟",
      "حوصله داری با هم یه کاری بکنیم؟ فقط بگو چی.",
      "هر چی تو دلته بگو؛ بگو از کجا شروع کنیم.",
    ],
    rand
  );
  return `${hello} ${how} ${ask}`;
};

/** Casual one-liners when a section opens (by route name). */
export const SCREEN_INTROS: Record<string, string[]> = {
  Welcome: ["خب، بیا یه کم از حال‌وهوات بگیم.", "بیا ببینیم این روزا چی تو دلته."],
  Crisis: ["من همین‌جام. اول از همه، این شماره‌ها همیشه جواب می‌دن."],
  Companion: ["اومدی پیشم؟ چه خوب!", "بیا یه کم با هم گپ بزنیم."],
  MentalHealthAwareness: ["بیا یه چیز تازه دربارهٔ حال خوب یاد بگیریم."],
  ActiveListening: ["خیالت راحت، حواسم هست."],
  QuitCoach: ["آفرین که اومدی! قدم‌به‌قدم با همیم."],
  Counseling: ["بیا دربارهٔ رابطه‌ت یه کم حرف بزنیم؛ بی‌قضاوت."],
  Storytelling: ["وقت قصه‌ست! بچه‌ها آماده‌ن؟"],
  FamilyCircle: ["بگو ببینم آدمای مهم زندگیت کیا هستن."],
  SocialAdvisor: ["با کی درگیری؟ بیا با هم یه راهی پیدا کنیم."],
  GiftAdvisor: ["هدیه؟ عاشق این کارم! بیا یه چیز خوب پیدا کنیم."],
  Fitness: ["بزن بریم سراغ یه بدن سرحال‌تر!"],
  CareerCoach: ["بیا دربارهٔ کار و آینده‌ت یه گپ جدی بزنیم."],
  LegalAdvisor: ["بیا یه کم قانون رو ساده کنیم."],
  PersonalTasks: ["بگو برات چی آماده کنم؛ آخرش خودت می‌فرستی."],
  Recipes: ["به‌به، آشپزی! امروز چی بپزیم؟"],
  StyleAdvisor: ["بیا یه تیپ خفن برات بچینیم!"],
  Music: ["یه کم موسیقی حالمونو خوب می‌کنه."],
};

export const screenIntro = (route: string, rand: () => number = Math.random): string | null => {
  const lines = SCREEN_INTROS[route];
  return lines ? pick(lines, rand) : null;
};

/** Keyword → feature. Order matters: more specific intents first
 *  (e.g. "کمک فوری" before generic words). */
const INTENTS: { feature: FeatureId | "crisis"; words: string[] }[] = [
  { feature: "crisis", words: ["خودکشی", "بمیرم", "کمک فوری", "اورژانس", "نجاتم", "خطر"] },
  { feature: "screening", words: ["افسرده", "اضطراب", "استرس", "حالم بده", "غمگین", "خودارزیابی", "غربالگری", "حال روان"] },
  { feature: "quitCoach", words: ["سیگار", "ترک", "اعتیاد", "الکل", "قلیون", "قلیان"] },
  { feature: "counseling", words: ["همسر", "زن و شوهر", "زناشویی", "رابطه", "دعوا", "نامزد"] },
  { feature: "storytelling", words: ["قصه", "داستان", "بچه", "کودک", "لالایی"] },
  { feature: "recipes", words: ["آشپزی", "غذا", "بپزم", "رسپی", "دستور پخت", "شام", "ناهار"] },
  { feature: "fitness", words: ["لاغر", "چاق", "وزن", "ورزش", "رژیم", "تناسب", "bmi"] },
  { feature: "career", words: ["کار", "شغل", "کسب", "بیزینس", "استارتاپ", "کارآفرین", "استخدام", "رزومه"] },
  { feature: "legal", words: ["حقوقی", "قانون", "وکیل", "شکایت", "دادگاه", "مهریه", "طلاق", "قرارداد"] },
  { feature: "gift", words: ["هدیه", "کادو", "تولد"] },
  { feature: "style", words: ["آرایش", "لباس", "تیپ", "استایل", "میکاپ"] },
  { feature: "family", words: ["خانواده", "مادر", "پدر", "برادر", "خواهر", "فامیل"] },
  { feature: "social", words: ["دوست", "همکار", "رئیس", "همسایه", "مهمونی"] },
  { feature: "tasks", words: ["ایمیل", "پیامک", "پیام", "زنگ", "تماس", "واتساپ"] },
  { feature: "mentalHealth", words: ["یاد بگیرم", "بدونم", "آگاهی", "اطلاعات"] },
  { feature: "companion", words: ["حرف بزنیم", "گپ", "تنهام", "حوصله", "دلم گرفته", "درد دل"] },
];

const normalize = (t: string) =>
  t
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Best-matching intent for what the user said/typed, or null. */
export const routeIntent = (text: string): FeatureId | "crisis" | null => {
  const t = normalize(text);
  if (!t) return null;
  for (const intent of INTENTS) {
    if (intent.words.some((w) => t.includes(normalize(w)))) return intent.feature;
  }
  return null;
};

export const intentReply = (matched: boolean, title?: string): string =>
  matched
    ? pick([`باشه، بریم سراغ ${title}!`, `عالیه! ${title}، بزن بریم.`, `حله، ${title}.`])
    : pick([
        "دقیق نفهمیدم چی دوست داری؛ یکی از کارت‌های پایین رو انتخاب کن یا یه جور دیگه بگو.",
        "ببخشید، متوجه نشدم. مثلاً بگو «می‌خوام آشپزی کنم» یا «حالم خوب نیست».",
      ]);
