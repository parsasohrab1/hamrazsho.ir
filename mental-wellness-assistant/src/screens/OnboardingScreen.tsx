import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BrandMark from "@/components/BrandMark";
import VoiceProfilePicker from "@/components/VoiceProfilePicker";
import { useVoiceProfile } from "@/state/useVoiceProfile";
import { BRAND } from "@/config/brand";
import { PRIVACY_POLICY, TERMS_OF_USE, LegalDoc } from "@/data/legalDocs";
import LegalDocView from "@/components/LegalDocView";

const C = BRAND.colors;

interface Props {
  onAccept: () => void;
}

const Check = ({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) => (
  <Pressable style={styles.checkRow} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }}>
    <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked ? <Text style={styles.checkMark}>✓</Text> : null}</View>
    <Text style={styles.checkLabel}>{label}</Text>
  </Pressable>
);

/** First-launch gate: what the app is (and isn't), where to get real help,
 *  and explicit acceptance of the terms + privacy policy with an 18+
 *  confirmation. Shown again whenever LEGAL_VERSION changes. Rendered
 *  outside the navigator, so nothing in the app is reachable before it. */
export default function OnboardingScreen({ onAccept }: Props) {
  const [adult, setAdult] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [reading, setReading] = useState<LegalDoc | null>(null);
  const { profile, update } = useVoiceProfile();

  if (reading) {
    return (
      <View style={styles.root}>
        <LegalDocView doc={reading} />
        <Pressable style={styles.primaryButton} onPress={() => setReading(null)}>
          <Text style={styles.primaryButtonText}>بازگشت</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.logo}>
        <BrandMark size={96} active={null} accessibilityLabel={BRAND.name.fa} />
      </View>
      <Text style={styles.title}>به {BRAND.name.fa} خوش آمدید</Text>
      <Text style={styles.subtitle}>{BRAND.tagline.fa}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>پیش از شروع بدانید</Text>
        <Text style={styles.bullet}>• {BRAND.name.fa} یک ابزار آموزشی و خودیاری است، نه پزشک، روان‌شناس یا وکیل.</Text>
        <Text style={styles.bullet}>• نتیجهٔ خودارزیابی، تشخیص پزشکی نیست.</Text>
        <Text style={styles.bullet}>• بدون ساختن حساب هم کامل کار می‌کند و اطلاعاتتان فقط روی گوشی می‌ماند.</Text>
        <Text style={styles.bullet}>• هر جا میکروفون هست، می‌توانید به‌جایش تایپ کنید.</Text>
      </View>

      <View style={[styles.card, styles.emergencyCard]}>
        <Text style={styles.cardTitle}>در شرایط اضطراری</Text>
        <Text style={styles.bullet}>
          بی‌درنگ تماس بگیرید: اورژانس ۱۱۵ · پلیس ۱۱۰ · آتش‌نشانی ۱۲۵ · اورژانس اجتماعی ۱۲۳ · صدای مشاور ۱۴۸۰
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>بیا با هم آشنا شیم</Text>
        <Text style={styles.bullet}>اسمت چیه؟ (اختیاری — فقط روی همین گوشی می‌مونه)</Text>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={(name) => update({ name })}
          placeholder="اسم کوچیکت"
          placeholderTextColor="#64748b"
        />
        <VoiceProfilePicker profile={profile} onChange={update} />
      </View>

      <Check checked={adult} onPress={() => setAdult(!adult)} label="۱۸ سال یا بیشتر سن دارم." />
      <Check
        checked={agreed}
        onPress={() => setAgreed(!agreed)}
        label="شرایط استفاده و سیاست حریم خصوصی را خواندم و می‌پذیرم."
      />
      <View style={styles.linksRow}>
        <Pressable onPress={() => setReading(TERMS_OF_USE)}>
          <Text style={styles.link}>شرایط استفاده</Text>
        </Pressable>
        <Text style={styles.linkSep}>·</Text>
        <Pressable onPress={() => setReading(PRIVACY_POLICY)}>
          <Text style={styles.link}>سیاست حریم خصوصی</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryButton, !(adult && agreed) && styles.disabled]}
        disabled={!(adult && agreed)}
        onPress={onAccept}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>شروع</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  container: { padding: 24, paddingTop: 56, gap: 12 },
  logo: { alignSelf: "center" },
  input: {
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
  title: { color: C.text, fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: { color: C.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 8 },
  card: { backgroundColor: C.surface, borderColor: C.surfaceBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  emergencyCard: { borderColor: C.danger },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: "700", textAlign: "right" },
  bullet: { color: C.textMuted, fontSize: 14, lineHeight: 22, textAlign: "right" },
  checkRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 6 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.primary, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: C.primary },
  checkMark: { color: "#fff", fontWeight: "700" },
  checkLabel: { color: C.text, fontSize: 14, flex: 1, textAlign: "right" },
  linksRow: { flexDirection: "row-reverse", justifyContent: "center", gap: 8 },
  link: { color: C.primary, fontSize: 14, textDecorationLine: "underline" },
  linkSep: { color: C.textMuted },
  primaryButton: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", margin: 8 },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.4 },
});
