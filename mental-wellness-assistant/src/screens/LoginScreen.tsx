import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { useAuth } from "@/state/AuthContext";
import { ApiError } from "@/services/apiClient";
import Disclaimer from "@/components/Disclaimer";
import { DISCLAIMERS } from "@/data/disclaimers";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

type Step = "phone" | "code";

export default function LoginScreen({ navigation }: Props) {
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorMessage = (err: unknown): string => {
    if (err instanceof ApiError) return err.message;
    return "امکان اتصال به سرور نیست. آدرس سرور را در تنظیمات بررسی کنید یا بعداً دوباره تلاش کنید.";
  };

  const sendCode = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp(phone.trim());
      setDevCode(res.devCode ?? null);
      setStep("code");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    if (code.trim().length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(phone.trim(), code.trim());
      navigation.goBack();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ورود با شمارهٔ موبایل</Text>

      {step === "phone" ? (
        <>
          <Text style={styles.label}>شمارهٔ موبایل</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="0912xxxxxxx"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            textAlign="right"
          />
          <Pressable
            style={[styles.primaryButton, (!phone.trim() || busy) && styles.disabledButton]}
            disabled={!phone.trim() || busy}
            onPress={sendCode}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>دریافت کد</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>کد ۶ رقمی ارسال‌شده به {phone}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="------"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
          {devCode ? <Text style={styles.devHint}>(حالت توسعه — کد: {devCode})</Text> : null}
          <Pressable
            style={[styles.primaryButton, (code.trim().length !== 6 || busy) && styles.disabledButton]}
            disabled={code.trim().length !== 6 || busy}
            onPress={confirmCode}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>تایید و ورود</Text>}
          </Pressable>
          <Pressable
            style={styles.textLink}
            onPress={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
          >
            <Text style={styles.textLinkText}>تغییر شماره یا ارسال دوبارهٔ کد</Text>
          </Pressable>
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.disclaimerGroup}>
        <Disclaimer text={DISCLAIMERS.cloudSyncLimitations} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 32, gap: 12 },
  title: { color: "#f8fafc", fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  label: { color: "#cbd5e1", fontSize: 14, textAlign: "right" },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  primaryButton: { backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disabledButton: { opacity: 0.5 },
  textLink: { paddingVertical: 10, alignItems: "center" },
  textLinkText: { color: "#60a5fa", fontSize: 14 },
  devHint: { color: "#94a3b8", fontSize: 12, textAlign: "center" },
  errorText: { color: "#f87171", fontSize: 14, textAlign: "right" },
  disclaimerGroup: { marginTop: 16 },
});
