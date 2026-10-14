import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BRAND } from "@/config/brand";
import { UserGender, VoicePreference, VoiceProfile, resolveVoiceGender } from "@/state/useVoiceProfile";

const C = BRAND.colors;

const GENDERS: { id: UserGender; label: string }[] = [
  { id: "male", label: "آقا" },
  { id: "female", label: "خانم" },
  { id: "unspecified", label: "ترجیح می‌دم نگم" },
];

const VOICES: { id: VoicePreference; label: string }[] = [
  { id: "auto", label: "پیشنهادی" },
  { id: "female", label: "صدای خانم" },
  { id: "male", label: "صدای آقا" },
];

const Chips = <T extends string>({
  items,
  value,
  onPick,
}: {
  items: { id: T; label: string }[];
  value: T;
  onPick: (v: T) => void;
}) => (
  <View style={styles.row}>
    {items.map((it) => (
      <Pressable
        key={it.id}
        style={[styles.chip, value === it.id && styles.chipOn]}
        onPress={() => onPick(it.id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: value === it.id }}
      >
        <Text style={[styles.chipText, value === it.id && styles.chipTextOn]}>{it.label}</Text>
      </Pressable>
    ))}
  </View>
);

/** Shared by onboarding and settings. The user picks the voice — the app
 *  never infers anything sensitive about them (see useVoiceProfile.ts). */
export default function VoiceProfilePicker({
  profile,
  onChange,
}: {
  profile: VoiceProfile;
  onChange: (patch: Partial<VoiceProfile>) => void;
}) {
  const resolved = resolveVoiceGender(profile) === "male" ? "آقا" : "خانم";
  return (
    <View style={styles.box}>
      <Text style={styles.label}>من ...</Text>
      <Chips items={GENDERS} value={profile.userGender} onPick={(userGender) => onChange({ userGender })} />
      <Text style={styles.label}>دوست داری با چه صدایی باهات حرف بزنم؟</Text>
      <Chips items={VOICES} value={profile.voicePref} onPick={(voicePref) => onChange({ voicePref })} />
      <Text style={styles.hint}>
        {profile.voicePref === "auto"
          ? `پیشنهاد ما: صدای ${resolved}. هر وقت خواستی از تنظیمات عوضش کن.`
          : `با صدای ${resolved} باهات حرف می‌زنم.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  label: { color: C.text, fontSize: 14, textAlign: "right", marginTop: 4 },
  row: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: C.surfaceBorder },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.textMuted, fontSize: 14 },
  chipTextOn: { color: "#fff", fontWeight: "700" },
  hint: { color: C.textMuted, fontSize: 12, textAlign: "right" },
});
