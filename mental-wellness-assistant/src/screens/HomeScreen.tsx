import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BrandMark from "@/components/BrandMark";
import Wordmark from "@/components/Wordmark";
import MicButton from "@/components/MicButton";
import { featureById } from "@/config/features";
import { intentReply, routeIntent, welcomeLine } from "@/engine/greetingEngine";
import { voiceService } from "@/voice/voiceService";
import { useSession } from "@/state/SessionContext";
import { useVoiceProfile } from "@/state/useVoiceProfile";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { BRAND } from "@/config/brand";
import { CATEGORY_LABEL, FeatureCategory, FeatureDef, canUseFeature, trialUsesLeft, visibleFeatures } from "@/config/features";
import { useFeatureUsage } from "@/state/useFeatureUsage";
import { PREMIUM_MODE } from "@/config/release";
import { usePremium } from "@/state/PremiumContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const C = BRAND.colors;
const CATEGORY_ORDER: FeatureCategory[] = ["wellbeing", "family", "life", "fun"];

/** The welcome is spoken once per app launch, not every time the user
 *  comes back to the home screen. */
let greetedThisLaunch = false;

const toFaDigits = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export default function HomeScreen({ navigation }: Props) {
  const { isPremium } = usePremium();
  const { voiceEnabled } = useSession();
  const { profile } = useVoiceProfile();
  const usage = useFeatureUsage();
  const features = visibleFeatures();
  const [greeting] = useState(() => welcomeLine(profile.name));
  const [reply, setReply] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const listeningSupported = voiceService.isListeningSupported();

  useEffect(() => {
    if (greetedThisLaunch || !voiceEnabled) return;
    greetedThisLaunch = true;
    voiceService.speak(greeting).catch(() => {});
  }, [greeting, voiceEnabled]);

  const say = (text: string) => {
    setReply(text);
    if (voiceEnabled) voiceService.speak(text).catch(() => {});
  };

  const handleRequest = (text: string) => {
    const intent = routeIntent(text);
    setDraft("");
    if (intent === "crisis") {
      navigation.navigate("Crisis");
      return;
    }
    if (!intent) {
      say(intentReply(false));
      return;
    }
    const f = featureById(intent);
    say(intentReply(true, f.title.fa));
    open(f);
  };

  const startListening = async () => {
    try {
      setListening(true);
      const transcript = await voiceService.listen();
      setListening(false);
      if (transcript) handleRequest(transcript);
    } catch {
      setListening(false);
    }
  };

  const open = (f: FeatureDef) => {
    // Locked premium features route to the paywall, which remembers where
    // to go after a successful purchase.
    if (!canUseFeature(f, isPremium, PREMIUM_MODE, usage(f.id))) {
      navigation.navigate("Paywall", { featureId: f.id });
      return;
    }
    // Route names come from the typed FEATURES table (checked in
    // RootNavigator), so this cast is safe.
    (navigation.navigate as (r: string) => void)(f.route);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <BrandMark size={64} active={null} accessibilityLabel={BRAND.name.fa} />
        <Wordmark height={30} />
      </View>

      <View style={styles.greetCard}>
        <Text style={styles.greetText}>{greeting}</Text>
        {reply ? <Text style={styles.replyText}>{reply}</Text> : null}
        <View style={styles.askRow}>
          {listeningSupported ? <MicButton listening={listening} onPress={startListening} /> : null}
          <TextInput
            style={styles.askInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="مثلاً: می‌خوام آشپزی کنم"
            placeholderTextColor="#64748b"
            onSubmitEditing={() => handleRequest(draft)}
            returnKeyType="send"
          />
        </View>
      </View>

      <Pressable
        style={styles.sos}
        onPress={() => navigation.navigate("Crisis")}
        accessibilityRole="button"
        accessibilityLabel="کمک فوری"
      >
        <Text style={styles.sosTitle}>🆘 کمک فوری</Text>
        <Text style={styles.sosSub}>شماره‌های اورژانس و خط مشاوره، تمرین تنفس</Text>
      </Pressable>

      {PREMIUM_MODE === "billing" && !isPremium ? (
        <Pressable style={styles.premiumBanner} onPress={() => navigation.navigate("Paywall", {})}>
          <Text style={styles.premiumBannerText}>👑 همهٔ بخش‌ها را با اشتراک ویژه باز کنید</Text>
        </Pressable>
      ) : null}

      {CATEGORY_ORDER.map((cat) => {
        const items = features.filter((f) => f.category === cat);
        if (!items.length) return null;
        return (
          <View key={cat} style={styles.section}>
            <Text style={styles.sectionTitle}>{CATEGORY_LABEL[cat].fa}</Text>
            <View style={styles.grid}>
              {items.map((f) => {
                const locked = !canUseFeature(f, isPremium, PREMIUM_MODE, usage(f.id));
                const left = trialUsesLeft(f, isPremium, usage(f.id));
                return (
                  <Pressable
                    key={f.id}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => open(f)}
                    accessibilityRole="button"
                    accessibilityLabel={`${f.title.fa}${locked ? "، نیازمند اشتراک ویژه" : left !== null ? `، ${left} بار رایگان در این ماه` : ""}`}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.icon}>{f.icon}</Text>
                      {locked ? (
                        <Text style={styles.lock}>👑</Text>
                      ) : left !== null ? (
                        <Text style={styles.trial}>{toFaDigits(left)} بار رایگان</Text>
                      ) : null}
                    </View>
                    <Text style={styles.cardTitle}>{f.title.fa}</Text>
                    <Text style={styles.cardSub} numberOfLines={2}>
                      {f.subtitle.fa}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <Pressable style={styles.settings} onPress={() => navigation.navigate("Settings")}>
        <Text style={styles.settingsText}>⚙️ تنظیمات، حساب کاربری و اشتراک</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  container: { padding: 16, paddingBottom: 48, gap: 12 },
  header: { alignItems: "center", marginTop: 8, marginBottom: 4 },
  brand: { color: C.text, fontSize: 26, fontWeight: "800", marginTop: 6 },
  greetCard: { backgroundColor: C.surface, borderColor: C.primary, borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  greetText: { color: C.text, fontSize: 16, lineHeight: 26, textAlign: "right" },
  replyText: { color: C.primary, fontSize: 14, lineHeight: 22, textAlign: "right" },
  askRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  askInput: {
    flex: 1,
    backgroundColor: C.background,
    color: C.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "right",
    fontSize: 15,
  },
  sos: { backgroundColor: "#3a1414", borderColor: C.danger, borderWidth: 1, borderRadius: 16, padding: 16 },
  sosTitle: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "right" },
  sosSub: { color: "#fecaca", fontSize: 13, textAlign: "right", marginTop: 4 },
  premiumBanner: { backgroundColor: "#3b2a0b", borderColor: C.accent, borderWidth: 1, borderRadius: 14, padding: 12 },
  premiumBannerText: { color: C.accent, fontSize: 14, fontWeight: "700", textAlign: "center" },
  section: { gap: 8, marginTop: 4 },
  sectionTitle: { color: C.text, fontSize: 17, fontWeight: "700", textAlign: "right" },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: C.surface,
    borderColor: C.surfaceBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 112,
  },
  cardPressed: { opacity: 0.8 },
  cardTop: { flexDirection: "row-reverse", justifyContent: "space-between" },
  icon: { fontSize: 26 },
  lock: { fontSize: 14 },
  trial: { color: C.accent, fontSize: 11, fontWeight: "700" },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "700", textAlign: "right", marginTop: 8 },
  cardSub: { color: C.textMuted, fontSize: 12, lineHeight: 18, textAlign: "right", marginTop: 2 },
  settings: { paddingVertical: 14, alignItems: "center" },
  settingsText: { color: C.primary, fontSize: 14 },
});
