import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { BRAND } from "@/config/brand";
import { LegalDoc } from "@/data/legalDocs";

const C = BRAND.colors;

export default function LegalDocView({ doc }: { doc: LegalDoc }) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{doc.title}</Text>
      <Text style={styles.updated}>آخرین به‌روزرسانی: {doc.updated}</Text>
      {doc.sections.map((s) => (
        <React.Fragment key={s.heading}>
          <Text style={styles.heading}>{s.heading}</Text>
          {s.paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  container: { padding: 20, paddingTop: 32, paddingBottom: 48 },
  title: { color: C.text, fontSize: 22, fontWeight: "700", textAlign: "right" },
  updated: { color: C.textMuted, fontSize: 12, textAlign: "right", marginBottom: 12 },
  heading: { color: C.text, fontSize: 16, fontWeight: "700", textAlign: "right", marginTop: 16, marginBottom: 6 },
  paragraph: { color: C.textMuted, fontSize: 14, lineHeight: 24, textAlign: "right", marginBottom: 6 },
});
