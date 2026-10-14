import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { useSession } from "@/state/SessionContext";
import Disclaimer from "@/components/Disclaimer";
import { DISCLAIMERS } from "@/data/disclaimers";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  const { startSession } = useSession();

  const begin = (mode: "quick" | "full") => {
    startSession(mode);
    navigation.navigate("Screening");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>خودارزیابی حال روان</Text>
      <Text style={styles.subtitle}>
        یک گفتگوی کوتاه صوتی یا نوشتاری، برای فهمیدن این‌که این روزها چه می‌گذرد و پیشنهاد کمک مناسب —
        پیشنهادهای سبک زندگی، منابع آموزشی، یا در صورت نیاز، راه‌های دریافت کمک فوری. پاسخ‌های شما فقط روی
        همین گوشی می‌ماند.
      </Text>

      <View style={styles.buttonGroup}>
        <Pressable style={styles.primaryButton} onPress={() => begin("full")}>
          <Text style={styles.primaryButtonText}>شروع گفتگوی کامل (تا ۱۰ پرسش)</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => begin("quick")}>
          <Text style={styles.secondaryButtonText}>گفتگوی سریع (۵ پرسش)</Text>
        </Pressable>
      </View>

      <Disclaimer text={DISCLAIMERS.screeningResult} />
      <Disclaimer text={DISCLAIMERS.crisisNotSubstitute} tone="warning" />
      <Disclaimer text={DISCLAIMERS.general} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 32, gap: 4 },
  title: { color: "#f8fafc", fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  subtitle: { color: "#cbd5e1", fontSize: 15, lineHeight: 22, textAlign: "right", marginBottom: 24 },
  buttonGroup: { gap: 12, marginBottom: 8 },
  primaryButton: { backgroundColor: "#1F9C94", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#475569",
  },
  secondaryButtonText: { color: "#e2e8f0", fontSize: 15, fontWeight: "600" },
});
