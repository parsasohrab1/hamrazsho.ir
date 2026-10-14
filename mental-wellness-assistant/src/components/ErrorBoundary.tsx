import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { BRAND } from "@/config/brand";

interface State {
  error: Error | null;
}

/** Last-resort crash screen. A mental-health app must never leave someone
 *  on a blank white screen — the emergency numbers stay one tap away even
 *  when something in the UI tree throws. */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.title}>متأسفیم، مشکلی پیش آمد.</Text>
        <Text style={styles.body}>اگر در خطر فوری هستید، همین حالا تماس بگیرید:</Text>
        <View style={styles.row}>
          {[
            ["اورژانس", "115"],
            ["صدای مشاور", "1480"],
            ["اورژانس اجتماعی", "123"],
          ].map(([label, phone]) => (
            <Pressable key={phone} style={styles.call} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Text style={styles.callText}>
                {label} {phone}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.retry} onPress={() => this.setState({ error: null })}>
          <Text style={styles.retryText}>تلاش دوباره</Text>
        </Pressable>
        <Text style={styles.small}>اگر مشکل تکرار شد، به {BRAND.supportEmail} خبر دهید.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.colors.background, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  title: { color: BRAND.colors.text, fontSize: 20, fontWeight: "700", textAlign: "center" },
  body: { color: BRAND.colors.textMuted, fontSize: 15, textAlign: "center" },
  row: { gap: 8, alignSelf: "stretch" },
  call: { backgroundColor: "#3a1414", borderColor: BRAND.colors.danger, borderWidth: 1, borderRadius: 12, padding: 12 },
  callText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  retry: { backgroundColor: BRAND.colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  retryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  small: { color: BRAND.colors.textMuted, fontSize: 12, textAlign: "center" },
});
