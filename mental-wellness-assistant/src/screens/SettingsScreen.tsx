import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { useSession } from "@/state/SessionContext";
import { useAuth } from "@/state/AuthContext";
import Disclaimer from "@/components/Disclaimer";
import { DISCLAIMERS } from "@/data/disclaimers";
import { voiceService } from "@/voice/voiceService";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { locale, setLocale, voiceEnabled, setVoiceEnabled } = useSession();
  const { isLoggedIn, phone, syncing, syncError, logout } = useAuth();
  const listeningSupported = voiceService.isListeningSupported();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>حساب کاربری و همگام‌سازی</Text>
      {isLoggedIn === null ? (
        <ActivityIndicator color="#60a5fa" />
      ) : isLoggedIn ? (
        <View style={styles.accountBox}>
          <Text style={styles.accountPhone}>وارد شده با شمارهٔ {phone}</Text>
          {syncing ? (
            <View style={styles.row}>
              <ActivityIndicator color="#60a5fa" />
              <Text style={styles.rowLabel}>در حال همگام‌سازی...</Text>
            </View>
          ) : null}
          {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}
          <Pressable style={styles.secondaryButton} onPress={logout}>
            <Text style={styles.secondaryButtonText}>خروج از حساب</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.primaryButtonText}>ورود برای پشتیبان‌گیری ابری</Text>
        </Pressable>
      )}
      <Disclaimer text={DISCLAIMERS.cloudSyncLimitations} />

      <View style={styles.row}>
        <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} />
        <Text style={styles.rowLabel}>پاسخ‌گویی صوتی (متن‌به‌گفتار)</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.statusBadge}>{listeningSupported ? "فعال" : "غیرفعال — از تایپ استفاده کنید"}</Text>
        <Text style={styles.rowLabel}>تشخیص گفتار (گفتار‌به‌متن)</Text>
      </View>

      <Text style={styles.sectionTitle}>زبان</Text>
      <View style={styles.langRow}>
        <Pressable
          style={[styles.langChip, locale === "fa" && styles.langChipActive]}
          onPress={() => setLocale("fa")}
        >
          <Text style={styles.langChipText}>فارسی</Text>
        </Pressable>
        <Pressable
          style={[styles.langChip, locale === "en" && styles.langChipActive]}
          onPress={() => setLocale("en")}
        >
          <Text style={styles.langChipText}>English</Text>
        </Pressable>
      </View>

      <Disclaimer text={DISCLAIMERS.general} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  rowLabel: { color: "#e2e8f0", fontSize: 15, flex: 1, textAlign: "right" },
  statusBadge: { color: "#94a3b8", fontSize: 12 },
  sectionTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "700", textAlign: "right", marginTop: 8 },
  langRow: { flexDirection: "row", gap: 10 },
  langChip: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, borderWidth: 1, borderColor: "#475569" },
  langChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  langChipText: { color: "#f1f5f9", fontWeight: "600" },
  accountBox: { gap: 10 },
  accountPhone: { color: "#e2e8f0", fontSize: 15, textAlign: "right" },
  primaryButton: { backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#475569",
  },
  secondaryButtonText: { color: "#e2e8f0", fontSize: 14, fontWeight: "600" },
  errorText: { color: "#f87171", fontSize: 13, textAlign: "right" },
});
