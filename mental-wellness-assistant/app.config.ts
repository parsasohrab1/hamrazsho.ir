import type { ExpoConfig } from "expo/config";
// Same file the UI reads, so the launcher name can't drift from the in-app name.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BRAND = require("./src/config/brandConfig.json");

/**
 * Build-time app config. Values that differ per store/release come from
 * env vars set by the build profiles in eas.json:
 *   EXPO_PUBLIC_STORE      bazaar | myket | play | web  (see src/config/release.ts)
 *   APP_VERSION            user-visible version, e.g. "1.0.0"
 *   ANDROID_VERSION_CODE   monotonically increasing integer per upload
 *
 * ⚠️ ANDROID_PACKAGE / bundle id can never change after the first store
 * upload — a rename of the brand keeps the same package id.
 */
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE ?? "ir.hamrazsho.app";
const version = process.env.APP_VERSION ?? "1.0.0";
const versionCode = Number(process.env.ANDROID_VERSION_CODE ?? 1);
const store = process.env.EXPO_PUBLIC_STORE ?? "dev";

const config: ExpoConfig = {
  name: BRAND.name.fa,
  slug: "hamraz",
  scheme: "hamraz",
  version,
  orientation: "portrait",
  userInterfaceStyle: "dark",
  icon: "./assets/icon.png",
  description: BRAND.tagline.fa,
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: BRAND.colors.background,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: ANDROID_PACKAGE,
    buildNumber: String(versionCode),
    infoPlist: {
      NSMicrophoneUsageDescription:
        "برای گفتگوی صوتی با دستیار، به میکروفون دسترسی نیاز است. در هر لحظه می‌توانید به‌جای صحبت کردن، تایپ کنید.",
      NSSpeechRecognitionUsageDescription: "برای تبدیل گفتار شما به متن و پاسخ‌گویی، به تشخیص گفتار نیاز است.",
      NSLocationWhenInUseUsageDescription:
        "فقط برای قرار دادن آدرس تقریبی شما در پیام اضطراری «گوش فعال»، و فقط با تأیید خودتان.",
      NSCameraUsageDescription: "برای گرفتن عکس در بخش «مشاور استایل». عکس‌ها فقط روی گوشی شما ذخیره می‌شوند.",
      NSPhotoLibraryUsageDescription: "برای انتخاب عکس از گالری در بخش «مشاور استایل».",
    },
  },
  android: {
    package: ANDROID_PACKAGE,
    versionCode,
    permissions: ["RECORD_AUDIO", "ACCESS_COARSE_LOCATION", "CAMERA"],
    // Principle of least privilege (and Google Play's photo/location
    // policies): the image picker uses the system Photo Picker, and
    // "Balanced" accuracy only needs coarse location.
    blockedPermissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon-foreground.png",
      backgroundColor: BRAND.colors.background,
    },
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/favicon.png",
    name: BRAND.name.fa,
    shortName: BRAND.name.fa,
    lang: "fa",
    themeColor: BRAND.colors.background,
    backgroundColor: BRAND.colors.background,
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          // Store requirements as of 2026: target a recent API level.
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
          enableProguardInReleaseBuilds: true,
        },
      },
    ],
    [
      "expo-speech-recognition",
      {
        microphonePermission: "برای گفتگوی صوتی با دستیار، به میکروفون دسترسی نیاز است.",
        speechRecognitionPermission: "برای تبدیل گفتار شما به متن، به تشخیص گفتار نیاز است.",
        androidSpeechServicePackages: ["com.google.android.googlequicksearchbox"],
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "برای انتخاب عکس از گالری در بخش «مشاور استایل».",
        cameraPermission: "برای گرفتن عکس در بخش «مشاور استایل».",
      },
    ],
    "./plugins/withStoreFlavor",
  ],
  extra: {
    store,
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
};

export default config;
