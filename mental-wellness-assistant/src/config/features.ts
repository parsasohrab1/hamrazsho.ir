import { PREMIUM_MODE, SHOW_DEMO_FEATURES } from "@/config/release";

/**
 * Catalogue of every user-facing feature: where it lives on the home
 * screen, and whether it is free or premium.
 *
 * Pricing rule (do not break): anything touching safety or mental health —
 * screening, crisis help, active listening, relationship safety, the quit
 * coach, mental-health awareness, the daily companion — is ALWAYS free.
 * We never put a paywall between a user and help. "trial" features are
 * free for FREE_TRIAL_USES uses each month; "premium" ones need the
 * subscription from the start.
 */
export type FeatureId =
  | "screening"
  | "companion"
  | "mentalHealth"
  | "activeListening"
  | "counseling"
  | "quitCoach"
  | "fitness"
  | "storytelling"
  | "recipes"
  | "style"
  | "career"
  | "social"
  | "gift"
  | "family"
  | "tasks"
  | "legal"
  | "music"
  | "favoriteMusic"
  | "songId";

export type FeatureCategory = "wellbeing" | "family" | "life" | "fun";
/** free = always free · trial = FREE_TRIAL_USES free uses per (solar
 *  Hijri) month, then premium · premium = subscription only (currently
 *  unused: every paid feature is a monthly trial). */
export type FeatureTier = "free" | "trial" | "premium";

/** How many times per month a "trial" feature can be opened for free. */
export const FREE_TRIAL_USES = 10;

export interface FeatureDef {
  id: FeatureId;
  /** Route name in RootStackParamList — kept as string here to avoid a
   *  navigator ↔ config import cycle; RootNavigator checks it at compile
   *  time via FEATURE_ROUTES. */
  route: string;
  icon: string;
  title: { fa: string; en: string };
  subtitle: { fa: string; en: string };
  category: FeatureCategory;
  tier: FeatureTier;
  /** Built on placeholder catalogs — never shipped in store builds. */
  demoOnly?: boolean;
}

export const FEATURES: FeatureDef[] = [
  {
    id: "screening",
    route: "Welcome",
    icon: "🧭",
    title: { fa: "خودارزیابی حال روان", en: "Wellbeing check-in" },
    subtitle: { fa: "۵ تا ۱۰ پرسش کوتاه صوتی یا نوشتاری", en: "5–10 short spoken or typed questions" },
    category: "wellbeing",
    tier: "free",
  },
  {
    id: "companion",
    route: "Companion",
    icon: "🤝",
    title: { fa: "رفیق همراه", en: "Daily companion" },
    subtitle: { fa: "حال‌واحوال روزانه و ثبت حال‌وهوا", en: "Daily check-ins and mood log" },
    category: "wellbeing",
    tier: "free",
  },
  {
    id: "mentalHealth",
    route: "MentalHealthAwareness",
    icon: "📘",
    title: { fa: "آگاهی از سلامت روان", en: "Mental health library" },
    subtitle: { fa: "۳۰ موضوع کوتاه و قابل‌فهم", en: "30 short, clear topics" },
    category: "wellbeing",
    tier: "free",
  },
  {
    id: "activeListening",
    route: "ActiveListening",
    icon: "🛟",
    title: { fa: "گوش فعال", en: "Active listening" },
    subtitle: { fa: "آماده‌کردن تماس اضطراری با یک جمله", en: "Prepare an emergency call by voice" },
    category: "wellbeing",
    tier: "free",
  },
  {
    id: "quitCoach",
    route: "QuitCoach",
    icon: "🌱",
    title: { fa: "ترک عادت", en: "Quit coach" },
    subtitle: { fa: "برنامهٔ تدریجی ترک سیگار و هر عادت دیگر", en: "Step-by-step plan to quit a habit" },
    category: "wellbeing",
    tier: "free",
  },
  {
    id: "counseling",
    route: "Counseling",
    icon: "💞",
    title: { fa: "روابط و زناشویی", en: "Relationships" },
    subtitle: { fa: "راهکارهای آموزشی برای رابطهٔ بهتر", en: "Educational tips for a healthier relationship" },
    category: "family",
    tier: "free",
  },
  {
    id: "storytelling",
    route: "Storytelling",
    icon: "🧸",
    title: { fa: "قصه برای کودکان", en: "Bedtime stories" },
    subtitle: { fa: "قصه‌های اورجینال با نام قهرمان دلخواه", en: "Original stories with your child's name" },
    category: "family",
    tier: "free",
  },
  {
    id: "family",
    route: "FamilyCircle",
    icon: "👨‍👩‍👧",
    title: { fa: "خانواده و اطرافیان", en: "Family circle" },
    subtitle: { fa: "یادداشت دربارهٔ آدم‌های مهم زندگی‌ات", en: "Notes about the people who matter" },
    category: "family",
    tier: "trial",
  },
  {
    id: "social",
    route: "SocialAdvisor",
    icon: "🗣️",
    title: { fa: "موقعیت‌های اجتماعی", en: "Social situations" },
    subtitle: { fa: "با آدم‌های مختلف چطور رفتار کنم؟", en: "How to handle different people" },
    category: "family",
    tier: "trial",
  },
  {
    id: "gift",
    route: "GiftAdvisor",
    icon: "🎁",
    title: { fa: "پیشنهاد هدیه", en: "Gift ideas" },
    subtitle: { fa: "بر اساس رابطه، مناسبت و بودجه", en: "By relation, occasion and budget" },
    category: "family",
    tier: "trial",
  },
  {
    id: "fitness",
    route: "Fitness",
    icon: "🏃",
    title: { fa: "تغذیه و تناسب اندام", en: "Nutrition & fitness" },
    subtitle: { fa: "محاسبهٔ BMI و راهکارهای عمومی", en: "BMI and general guidance" },
    category: "life",
    tier: "free",
  },
  {
    id: "career",
    route: "CareerCoach",
    icon: "💼",
    title: { fa: "مشاور شغلی", en: "Career coach" },
    subtitle: { fa: "کارمندی یا کارآفرینی؟ با چک‌لیست مسیر", en: "Employee or founder? With a roadmap" },
    category: "life",
    tier: "trial",
  },
  {
    id: "legal",
    route: "LegalAdvisor",
    icon: "⚖️",
    title: { fa: "آگاهی حقوقی", en: "Legal basics" },
    subtitle: { fa: "توضیح ساده دربارهٔ موضوعات رایج حقوقی", en: "Plain-language legal topics" },
    category: "life",
    tier: "trial",
  },
  {
    id: "tasks",
    route: "PersonalTasks",
    icon: "✉️",
    title: { fa: "کارهای شخصی", en: "Personal tasks" },
    subtitle: { fa: "آماده‌کردن ایمیل، پیامک و تماس", en: "Draft emails, texts and calls" },
    category: "life",
    tier: "trial",
  },
  {
    id: "recipes",
    route: "Recipes",
    icon: "🍲",
    title: { fa: "آشپزی گام‌به‌گام", en: "Cook along" },
    subtitle: { fa: "راهنمای صوتی پخت غذاهای دنیا", en: "Voice-guided world recipes" },
    category: "fun",
    tier: "trial",
  },
  {
    id: "style",
    route: "StyleAdvisor",
    icon: "👗",
    title: { fa: "مشاور استایل", en: "Style advisor" },
    subtitle: { fa: "ایدهٔ آرایش و ست‌کردن لباس", en: "Makeup ideas and outfit matching" },
    category: "fun",
    tier: "trial",
  },
  {
    id: "music",
    route: "Music",
    icon: "🎧",
    title: { fa: "موسیقی آرام‌بخش", en: "Calming music" },
    subtitle: { fa: "(نسخهٔ نمایشی)", en: "(demo)" },
    category: "fun",
    tier: "free",
    demoOnly: true,
  },
  {
    id: "favoriteMusic",
    route: "FavoriteMusic",
    icon: "🎵",
    title: { fa: "موسیقی مورد علاقه", en: "Favorite music" },
    subtitle: { fa: "(نسخهٔ نمایشی)", en: "(demo)" },
    category: "fun",
    tier: "free",
    demoOnly: true,
  },
  {
    id: "songId",
    route: "SongId",
    icon: "🔎",
    title: { fa: "پیدا کردن آهنگ", en: "Find a song" },
    subtitle: { fa: "(نسخهٔ نمایشی)", en: "(demo)" },
    category: "fun",
    tier: "free",
    demoOnly: true,
  },
];

export const CATEGORY_LABEL: Record<FeatureCategory, { fa: string; en: string }> = {
  wellbeing: { fa: "حال خوب", en: "Wellbeing" },
  family: { fa: "خانواده و روابط", en: "Family & relationships" },
  life: { fa: "زندگی و کار", en: "Life & work" },
  fun: { fa: "سرگرمی و سبک زندگی", en: "Lifestyle" },
};

export const featureById = (id: FeatureId): FeatureDef => {
  const f = FEATURES.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown feature ${id}`);
  return f;
};

export const featureByRoute = (route: string): FeatureDef | undefined => FEATURES.find((f) => f.route === route);

/** Whether a feature exists at all in this build (demo gating + "hidden"
 *  premium mode). Pure — mode flags are parameters so it's testable. */
export const isFeatureVisible = (
  f: FeatureDef,
  opts: { showDemo: boolean; premiumMode: typeof PREMIUM_MODE } = {
    showDemo: SHOW_DEMO_FEATURES,
    premiumMode: PREMIUM_MODE,
  }
): boolean => {
  if (f.demoOnly && !opts.showDemo) return false;
  if (f.tier === "premium" && opts.premiumMode === "hidden") return false;
  return true;
};

/** Whether the user may open the feature right now. `usedCount` is how
 *  many times this device has already opened a "trial" feature. */
export const canUseFeature = (
  f: FeatureDef,
  isPremium: boolean,
  premiumMode: typeof PREMIUM_MODE = PREMIUM_MODE,
  usedCount = 0
): boolean => {
  if (f.tier === "free") return true;
  if (premiumMode === "unlocked" || isPremium) return true;
  if (f.tier === "trial") {
    // Builds that can't sell anything keep trial features free forever.
    if (premiumMode === "hidden") return true;
    return usedCount < FREE_TRIAL_USES;
  }
  return false;
};

/** Free uses left for a trial feature (null = not a metered feature). */
export const trialUsesLeft = (f: FeatureDef, isPremium: boolean, usedCount: number, premiumMode: typeof PREMIUM_MODE = PREMIUM_MODE) => {
  if (f.tier !== "trial" || isPremium || premiumMode !== "billing") return null;
  return Math.max(0, FREE_TRIAL_USES - usedCount);
};

export const visibleFeatures = () => FEATURES.filter((f) => isFeatureVisible(f));
