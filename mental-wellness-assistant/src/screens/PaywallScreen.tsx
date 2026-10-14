import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { BRAND } from "@/config/brand";
import { FEATURES, FREE_TRIAL_USES, featureById } from "@/config/features";

const FREE_TRIAL_USES_FA = String(FREE_TRIAL_USES).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
import { STORE } from "@/config/release";
import { PLANS, PlanId, formatToman } from "@/billing/plans";
import { BillingUnavailableError } from "@/billing/storeBilling";
import { getPlans } from "@/services/billingApi";
import { ApiError } from "@/services/apiClient";
import { isBackendConfigured } from "@/services/apiConfig";
import { LoginRequiredError, usePremium } from "@/state/PremiumContext";
import { useAuth } from "@/state/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

const C = BRAND.colors;

const notify = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

export default function PaywallScreen({ navigation, route }: Props) {
  const { isPremium, busy, purchase, restore, entitlement } = usePremium();
  const { isLoggedIn } = useAuth();
  const [selected, setSelected] = useState<PlanId>("premium_yearly");
  const [webPrices, setWebPrices] = useState<Record<string, number>>({});
  const target = route.params?.featureId ? featureById(route.params.featureId) : null;
  const premiumFeatures = FEATURES.filter((f) => f.tier !== "free" && !f.demoOnly);

  useEffect(() => {
    if (STORE !== "web" && Platform.OS !== "web") return;
    if (!isBackendConfigured()) return;
    getPlans()
      .then((r) => setWebPrices(Object.fromEntries(r.plans.map((p) => [p.id, p.webPriceRial / 10]))))
      .catch(() => {});
  }, []);

  const continueToTarget = () => {
    if (target) (navigation.replace as (r: string) => void)(target.route);
    else navigation.goBack();
  };

  const run = async (action: () => Promise<boolean>, successMsg: string) => {
    try {
      const ok = await action();
      if (ok) {
        notify("اشتراک ویژه فعال شد", successMsg);
        continueToTarget();
      }
    } catch (e) {
      if (e instanceof LoginRequiredError) {
        navigation.navigate("Login");
        return;
      }
      const msg =
        e instanceof BillingUnavailableError
          ? e.message
          : e instanceof ApiError && e.status === 503
            ? "پرداخت موقتاً در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید."
            : e instanceof ApiError && e.status === 409
              ? "این خرید قبلاً روی حساب دیگری ثبت شده است. با پشتیبانی تماس بگیرید."
              : e instanceof ApiError && e.status === 402
                ? "فروشگاه این خرید را تأیید نکرد. اگر مبلغی کسر شده، با پشتیبانی تماس بگیرید."
                : "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
      notify("انجام نشد", msg);
    }
  };

  if (isPremium) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.title}>👑 اشتراک ویژهٔ شما فعال است</Text>
        {entitlement.expiresAt ? (
          <Text style={styles.muted}>اعتبار تا {new Date(entitlement.expiresAt).toLocaleDateString("fa-IR")}</Text>
        ) : null}
        <Pressable style={styles.primaryButton} onPress={continueToTarget}>
          <Text style={styles.primaryButtonText}>ادامه</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>👑 اشتراک ویژهٔ {BRAND.name.fa}</Text>
      {target ? (
        <Text style={styles.muted}>
          {target.tier === "trial"
            ? `${FREE_TRIAL_USES_FA} بار استفادهٔ رایگان این ماه از «${target.title.fa}» تمام شد. با اشتراک ویژه بدون محدودیت ادامه بده؛ یا از اول ماه بعد دوباره ${FREE_TRIAL_USES_FA} بار رایگان داری.`
            : `«${target.title.fa}» بخشی از اشتراک ویژه است.`}
        </Text>
      ) : null}

      <View style={styles.card}>
        {premiumFeatures.map((f) => (
          <Text key={f.id} style={styles.benefit}>
            {f.icon} {f.title.fa}
          </Text>
        ))}
        <Text style={styles.freeNote}>
          هر کدام از این بخش‌ها ماهی {FREE_TRIAL_USES_FA} بار رایگان است؛ با اشتراک، بدون محدودیت. خودارزیابی، کمک فوری،
          گوش فعال، ترک عادت، رفیق همراه و همهٔ بخش‌های ایمنی همیشه و بی‌محدودیت رایگان‌اند.
        </Text>
      </View>

      {PLANS.map((p) => {
        const price = webPrices[p.id] ?? p.fallbackPriceToman;
        const active = selected === p.id;
        return (
          <Pressable
            key={p.id}
            style={[styles.plan, active && styles.planActive]}
            onPress={() => setSelected(p.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <View style={styles.planRow}>
              <Text style={styles.planTitle}>{p.title.fa}</Text>
              {p.badge ? <Text style={styles.badge}>{p.badge.fa}</Text> : null}
            </View>
            {/* On Bazaar the store's own sheet shows the authoritative price. */}
            <Text style={styles.planPrice}>{formatToman(price)}</Text>
          </Pressable>
        );
      })}

      {!isLoggedIn ? (
        <Text style={styles.muted}>برای خرید، ابتدا با شمارهٔ موبایل وارد شوید تا اشتراک روی حساب شما ثبت شود.</Text>
      ) : null}

      <Pressable
        style={[styles.primaryButton, busy && styles.disabled]}
        disabled={busy}
        onPress={() => run(() => purchase(selected), "از همهٔ بخش‌ها لذت ببرید.")}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{isLoggedIn ? "خرید اشتراک" : "ورود و خرید"}</Text>}
      </Pressable>

      <Pressable disabled={busy} onPress={() => run(restore, "خرید قبلی شما بازیابی شد.")} style={styles.linkButton}>
        <Text style={styles.link}>بازیابی خرید قبلی</Text>
      </Pressable>

      <Text style={styles.fine}>
        {STORE === "bazaar"
          ? "پرداخت از طریق کافه‌بازار انجام می‌شود و اشتراک تا زمان لغو از بخش «اشتراک‌های من» در بازار تمدید می‌شود."
          : "پرداخت از طریق درگاه امن زرین‌پال انجام می‌شود. اشتراک خودکار تمدید نمی‌شود."}
      </Text>
      <View style={styles.legalRow}>
        <Pressable onPress={() => navigation.navigate("LegalDoc", { doc: "terms" })}>
          <Text style={styles.link}>شرایط استفاده</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("LegalDoc", { doc: "privacy" })}>
          <Text style={styles.link}>حریم خصوصی</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  center: { alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  container: { padding: 20, gap: 12, paddingBottom: 48 },
  title: { color: C.text, fontSize: 22, fontWeight: "800", textAlign: "center" },
  muted: { color: C.textMuted, fontSize: 14, textAlign: "center", lineHeight: 22 },
  card: { backgroundColor: C.surface, borderColor: C.surfaceBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  benefit: { color: C.text, fontSize: 15, textAlign: "right" },
  freeNote: { color: C.primary, fontSize: 13, textAlign: "right", marginTop: 8, lineHeight: 20 },
  plan: { borderColor: C.surfaceBorder, borderWidth: 2, borderRadius: 16, padding: 16, backgroundColor: C.surface },
  planActive: { borderColor: C.accent },
  planRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  planTitle: { color: C.text, fontSize: 16, fontWeight: "700" },
  badge: { color: C.background, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, fontWeight: "700", overflow: "hidden" },
  planPrice: { color: C.textMuted, fontSize: 15, textAlign: "right", marginTop: 6 },
  primaryButton: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center", alignSelf: "stretch" },
  primaryButtonText: { color: C.background, fontSize: 17, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  linkButton: { alignItems: "center", paddingVertical: 8 },
  link: { color: C.primary, fontSize: 14 },
  fine: { color: C.textMuted, fontSize: 12, textAlign: "center", lineHeight: 18 },
  legalRow: { flexDirection: "row-reverse", justifyContent: "center", gap: 16 },
});
