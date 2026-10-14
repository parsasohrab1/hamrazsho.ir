import React, { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BRAND } from "@/config/brand";
import { SEGMENTS, Segment } from "@/config/segments";
import BrandMark from "@/components/BrandMark";
import Wordmark from "@/components/Wordmark";
import AdvisoryTopicBrowser from "@/components/AdvisoryTopicBrowser";
import LegalDocView from "@/components/LegalDocView";
import { MENTAL_HEALTH_TOPICS } from "@/data/mentalHealthTopics";
import { LEGAL_TOPICS } from "@/data/legalTopics";
import { DISCLAIMERS } from "@/data/disclaimers";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@/data/legalDocs";

/**
 * The website (web build). A deliberately read-only showcase: download
 * links for the mobile apps, the educational content library to read,
 * emergency numbers, and the policies. There is no voice assistant and no
 * interactive feature here — talking with the assistant, and the
 * day-by-day personalisation that comes from using it, happen only in the
 * installed app.
 */
type Tab = "home" | "mind" | "legal" | "help" | "privacy" | "terms";

const C = BRAND.colors;

const TABS: { id: Tab; label: string; segment: Segment | null }[] = [
  { id: "home", label: "خانه", segment: null },
  { id: "mind", label: "سلامت روان", segment: "mind" },
  { id: "legal", label: "آگاهی حقوقی", segment: "business" },
  { id: "help", label: "کمک فوری", segment: "mind" },
];

const STORES = [
  { key: "bazaar", label: "دریافت از کافه‌بازار", url: BRAND.downloads.bazaar, primary: true },
  { key: "myket", label: "دریافت از مایکت", url: BRAND.downloads.myket, primary: false },
  { key: "play", label: "دریافت از گوگل‌پلی", url: BRAND.downloads.play, primary: false },
  { key: "apk", label: "دانلود مستقیم (APK)", url: BRAND.downloads.apk, primary: false },
];

const EMERGENCY = [
  { label: "اورژانس", phone: "115" },
  { label: "صدای مشاور بهزیستی", phone: "1480" },
  { label: "اورژانس اجتماعی", phone: "123" },
  { label: "پلیس", phone: "110" },
  { label: "آتش‌نشانی", phone: "125" },
];

const open = (url: string) => Linking.openURL(url).catch(() => {});

function Downloads() {
  return (
    <View style={styles.downloads}>
      {STORES.map((s) => (
        <Pressable key={s.key} style={[styles.storeBtn, s.primary && styles.storeBtnPrimary]} onPress={() => open(s.url)}>
          <Text style={[styles.storeBtnText, s.primary && styles.storeBtnTextPrimary]}>{s.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Home({ go }: { go: (t: Tab) => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <BrandMark size={120} active={null} accessibilityLabel={BRAND.name.fa} />
        <Wordmark height={44} />
        <Text style={styles.heroSub}>{BRAND.tagline.fa}</Text>
        <Downloads />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎙️ گفتگوی صوتی فقط در اپ</Text>
        <Text style={styles.body}>
          برای این‌که با {BRAND.name.fa} حرف بزنی و قدم‌به‌قدم با هم جلو بریم، اپ موبایل رو نصب کن. هر چه بیشتر هر روز
          با {BRAND.name.fa} وقت بگذرونی، حال‌وهوا، آدمای مهم زندگیت و مسیرت رو بهتر به خاطر می‌سپاره و پیشنهادهاش
          به خودت نزدیک‌تر می‌شه — همه‌اش فقط روی گوشی خودت.
        </Text>
        <Text style={styles.body}>
          این وب‌سایت فقط برای مطالعهٔ محتواست و به دستیار صوتی وصل نیست.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>چهار محور همراز</Text>
      <View style={styles.pillars}>
        {SEGMENTS.map((s) => (
          <View key={s.id} style={styles.pillar}>
            <BrandMark size={96} active={s.id} />
            <Text style={styles.pillarText}>{s.label.fa}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>بخوان و یاد بگیر</Text>
      <Pressable style={styles.linkCard} onPress={() => go("mind")}>
        <Text style={styles.cardTitle}>📘 آگاهی از سلامت روان</Text>
        <Text style={styles.body}>{MENTAL_HEALTH_TOPICS.length} موضوع کوتاه و قابل‌فهم دربارهٔ خودت و نزدیکانت</Text>
      </Pressable>
      <Pressable style={styles.linkCard} onPress={() => go("legal")}>
        <Text style={styles.cardTitle}>⚖️ آگاهی حقوقی</Text>
        <Text style={styles.body}>{LEGAL_TOPICS.length} موضوع رایج حقوقی به زبان ساده</Text>
      </Pressable>

      <Pressable style={[styles.linkCard, styles.sos]} onPress={() => go("help")}>
        <Text style={styles.cardTitle}>🆘 در شرایط اضطراری</Text>
        <Text style={styles.body}>شماره‌های اورژانس و خط مشاوره</Text>
      </Pressable>
    </View>
  );
}

function Help() {
  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>کمک فوری</Text>
      <Text style={styles.body}>{DISCLAIMERS.crisisNotSubstitute.fa}</Text>
      {EMERGENCY.map((e) => (
        <Pressable key={e.phone} style={styles.callBtn} onPress={() => open(`tel:${e.phone}`)}>
          <Text style={styles.callText}>
            {e.label} — {e.phone}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function WebSite() {
  const [tab, setTab] = useState<Tab>("home");
  return (
    <View style={styles.root}>
      <View style={styles.nav}>
        <Pressable style={styles.navBrand} onPress={() => setTab("home")}>
          <BrandMark size={48} active={TABS.find((t) => t.id === tab)?.segment ?? null} />
          <Text style={styles.navBrandText}>{BRAND.name.fa}</Text>
        </Pressable>
        <View style={styles.navTabs}>
          {TABS.slice(1).map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.navTab, tab === t.id && styles.navTabOn]}>
              <Text style={[styles.navTabText, tab === t.id && styles.navTabTextOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          {tab === "home" && <Home go={setTab} />}
          {tab === "mind" && (
            <AdvisoryTopicBrowser
              heading="آگاهی از سلامت روان"
              subheading="نشانه‌های رایج مشکلات سلامت روان در خودتان و نزدیکان — برای افزایش آگاهی، نه تشخیص."
              topics={MENTAL_HEALTH_TOPICS}
              disclaimer={DISCLAIMERS.mentalHealthAwarenessLimitations}
              allowVoice={false}
            />
          )}
          {tab === "legal" && (
            <AdvisoryTopicBrowser
              heading="آگاهی حقوقی"
              subheading="توضیح سادهٔ موضوعات رایج حقوقی — نه مشاورهٔ اختصاصی."
              topics={LEGAL_TOPICS}
              disclaimer={DISCLAIMERS.legalAdvisorLimitations}
              allowVoice={false}
            />
          )}
          {tab === "help" && <Help />}
          {tab === "privacy" && <LegalDocView doc={PRIVACY_POLICY} />}
          {tab === "terms" && <LegalDocView doc={TERMS_OF_USE} />}

          {tab !== "home" ? (
            <View style={styles.cta}>
              <Text style={styles.cardTitle}>می‌خوای با {BRAND.name.fa} حرف بزنی؟</Text>
              <Text style={styles.body}>گفتگوی صوتی و همراهی روزانه فقط در اپ موبایل است.</Text>
              <Downloads />
            </View>
          ) : null}

          <View style={styles.footer}>
            <Pressable onPress={() => setTab("privacy")}>
              <Text style={styles.footerLink}>حریم خصوصی</Text>
            </Pressable>
            <Pressable onPress={() => setTab("terms")}>
              <Text style={styles.footerLink}>شرایط استفاده</Text>
            </Pressable>
            <Pressable onPress={() => open(`mailto:${BRAND.supportEmail}`)}>
              <Text style={styles.footerLink}>{BRAND.supportEmail}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  nav: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceBorder,
  },
  navBrand: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  navBrandText: { color: C.text, fontSize: 20, fontWeight: "800" },
  navTabs: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  navTab: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  navTabOn: { backgroundColor: C.surface },
  navTabText: { color: C.textMuted, fontSize: 14 },
  navTabTextOn: { color: C.text, fontWeight: "700" },
  scroll: { paddingBottom: 48 },
  container: { width: "100%", maxWidth: 820, alignSelf: "center", padding: 16, gap: 16 },
  page: { gap: 14 },
  hero: { alignItems: "center", gap: 10, paddingVertical: 24 },
  heroTitle: { color: C.text, fontSize: 36, fontWeight: "800" },
  heroSub: { color: C.textMuted, fontSize: 16, textAlign: "center", lineHeight: 26 },
  downloads: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 8 },
  storeBtn: { borderWidth: 1, borderColor: C.surfaceBorder, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
  storeBtnPrimary: { backgroundColor: C.primary, borderColor: C.primary },
  storeBtnText: { color: C.text, fontSize: 15, fontWeight: "600" },
  storeBtnTextPrimary: { color: "#fff" },
  card: { backgroundColor: C.surface, borderColor: C.surfaceBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  linkCard: { backgroundColor: C.surface, borderColor: C.surfaceBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  sos: { borderColor: C.danger },
  cardTitle: { color: C.text, fontSize: 17, fontWeight: "700", textAlign: "right" },
  body: { color: C.textMuted, fontSize: 15, lineHeight: 26, textAlign: "right" },
  sectionTitle: { color: C.text, fontSize: 19, fontWeight: "800", textAlign: "right", marginTop: 8 },
  pillars: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  pillar: {
    flexBasis: "45%",
    flexGrow: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
  },
  pillarText: { color: C.text, fontSize: 15, fontWeight: "600" },
  pageTitle: { color: C.text, fontSize: 24, fontWeight: "800", textAlign: "right" },
  callBtn: { backgroundColor: "#3a1414", borderColor: C.danger, borderWidth: 1, borderRadius: 12, padding: 14 },
  callText: { color: "#fff", fontSize: 17, fontWeight: "700", textAlign: "center" },
  cta: { backgroundColor: C.surface, borderColor: C.primary, borderWidth: 1, borderRadius: 16, padding: 16, gap: 6, alignItems: "stretch" },
  footer: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 24 },
  footerLink: { color: C.primary, fontSize: 14 },
});
