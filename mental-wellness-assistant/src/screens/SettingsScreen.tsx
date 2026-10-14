import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from "react-native";
import Constants from "expo-constants";
import { BRAND } from "@/config/brand";
import { PREMIUM_MODE, STORE } from "@/config/release";
import { usePremium } from "@/state/PremiumContext";
import { useVoiceProfile } from "@/state/useVoiceProfile";
import VoiceProfilePicker from "@/components/VoiceProfilePicker";
import { clearLocalData, deleteAccount, exportAccountData } from "@/services/accountApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { useSession } from "@/state/SessionContext";
import { useAuth } from "@/state/AuthContext";
import Disclaimer from "@/components/Disclaimer";
import { DISCLAIMERS } from "@/data/disclaimers";
import { voiceService } from "@/voice/voiceService";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { voiceEnabled, setVoiceEnabled } = useSession();
  const { isLoggedIn, phone, syncing, syncError, logout } = useAuth();
  const listeningSupported = voiceService.isListeningSupported();
  const { isPremium, entitlement } = usePremium();
  const { profile: voiceProfile, update: updateVoiceProfile } = useVoiceProfile();
  const [working, setWorking] = useState(false);

  const confirm = (title: string, message: string, action: string): Promise<boolean> =>
    Platform.OS === "web"
      ? Promise.resolve(window.confirm(`${title}

${message}`))
      : new Promise((resolve) =>
          Alert.alert(title, message, [
            { text: "انصراف", style: "cancel", onPress: () => resolve(false) },
            { text: action, style: "destructive", onPress: () => resolve(true) },
          ])
        );

  const notify = (msg: string) => (Platform.OS === "web" ? window.alert(msg) : Alert.alert(BRAND.name.fa, msg));

  const onExport = async () => {
    setWorking(true);
    try {
      const json = JSON.stringify(await exportAccountData(), null, 2);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-data.json";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: json, title: "my-data.json" });
      }
    } catch (e) {
      notify(`دریافت اطلاعات انجام نشد: ${(e as Error).message}`);
    } finally {
      setWorking(false);
    }
  };

  const onDeleteAccount = async () => {
    const ok = await confirm(
      "حذف همیشگی حساب",
      "همهٔ اطلاعات همگام‌شده، فایل‌ها و شمارهٔ موبایل شما از سرور پاک می‌شود و قابل بازگشت نیست. اشتراک فعال هم از بین می‌رود (اشتراک بازار را جداگانه از خود بازار لغو کنید).",
      "حذف حساب"
    );
    if (!ok) return;
    setWorking(true);
    try {
      await deleteAccount();
      await logout();
      notify("حساب شما حذف شد. اطلاعات روی همین گوشی باقی است و می‌توانید جداگانه پاکش کنید.");
    } catch (e) {
      notify(`حذف حساب انجام نشد: ${(e as Error).message}`);
    } finally {
      setWorking(false);
    }
  };

  const onClearLocal = async () => {
    const ok = await confirm("پاک کردن اطلاعات این گوشی", "همهٔ اطلاعاتی که برنامه روی همین گوشی ذخیره کرده پاک می‌شود.", "پاک کن");
    if (!ok) return;
    await clearLocalData();
    await logout();
    notify("اطلاعات این گوشی پاک شد. برای اعمال کامل، برنامه را یک بار ببندید و دوباره باز کنید.");
  };

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
          <Pressable style={styles.secondaryButton} disabled={working} onPress={onExport}>
            <Text style={styles.secondaryButtonText}>دریافت نسخه‌ای از اطلاعات من</Text>
          </Pressable>
          <Pressable style={styles.dangerButton} disabled={working} onPress={onDeleteAccount}>
            <Text style={styles.dangerButtonText}>حذف همیشگی حساب کاربری</Text>
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

      <Text style={styles.sectionTitle}>صدای دستیار</Text>
      <VoiceProfilePicker profile={voiceProfile} onChange={updateVoiceProfile} />

      {PREMIUM_MODE === "billing" ? (
        <>
          <Text style={styles.sectionTitle}>اشتراک ویژه</Text>
          <Text style={styles.rowLabel}>
            {isPremium && entitlement.expiresAt
              ? `فعال تا ${new Date(entitlement.expiresAt).toLocaleDateString("fa-IR")}`
              : "فعال نیست"}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Paywall", {})}>
            <Text style={styles.secondaryButtonText}>{isPremium ? "جزئیات اشتراک" : "خرید یا بازیابی اشتراک"}</Text>
          </Pressable>
          {STORE === "bazaar" ? (
            <Pressable onPress={() => Linking.openURL("bazaar://subscriptions").catch(() => {})}>
              <Text style={styles.link}>مدیریت یا لغو اشتراک در کافه‌بازار</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>حریم خصوصی و قوانین</Text>
      <Pressable onPress={() => navigation.navigate("LegalDoc", { doc: "privacy" })}>
        <Text style={styles.link}>سیاست حریم خصوصی</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("LegalDoc", { doc: "terms" })}>
        <Text style={styles.link}>شرایط استفاده</Text>
      </Pressable>
      <Pressable style={styles.dangerButton} onPress={onClearLocal}>
        <Text style={styles.dangerButtonText}>پاک کردن همهٔ اطلاعات روی این گوشی</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>پشتیبانی</Text>
      <Pressable onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => {})}>
        <Text style={styles.link}>{BRAND.supportEmail}</Text>
      </Pressable>

      <Disclaimer text={DISCLAIMERS.general} />
      <Text style={styles.version}>
        {BRAND.name.fa} · نسخهٔ {Constants.expoConfig?.version ?? "?"} · {STORE}
      </Text>
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
  langChipActive: { backgroundColor: "#1F9C94", borderColor: "#1F9C94" },
  langChipText: { color: "#f1f5f9", fontWeight: "600" },
  accountBox: { gap: 10 },
  accountPhone: { color: "#e2e8f0", fontSize: 15, textAlign: "right" },
  primaryButton: { backgroundColor: "#1F9C94", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
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
  dangerButton: { borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#dc2626" },
  dangerButtonText: { color: "#fca5a5", fontSize: 14, fontWeight: "600" },
  link: { color: "#1F9C94", fontSize: 14, textAlign: "right" },
  version: { color: "#64748b", fontSize: 12, textAlign: "center", marginTop: 8 },
  errorText: { color: "#f87171", fontSize: 13, textAlign: "right" },
});
