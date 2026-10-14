import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "@/state/SessionContext";
import { searchTopics, topicToSpokenText } from "@/engine/advisoryContentEngine";
import { voiceService } from "@/voice/voiceService";
import { AdvisoryTopic } from "@/types";
import Disclaimer from "@/components/Disclaimer";

interface Props {
  heading: string;
  subheading: string;
  topics: AdvisoryTopic[];
  disclaimer: { fa: string; en: string };
  /** false on the read-only website: no voice read-out. */
  allowVoice?: boolean;
}

/** Shared browse/search UI for the legal-advisor and mental-health-
 *  awareness skills — both are the same shape: a small curated topic
 *  library, searchable by keyword, one topic expandable at a time
 *  with an optional voice read-out. See DISCLAIMERS.legalAdvisorLimitations
 *  and DISCLAIMERS.mentalHealthAwarenessLimitations. */
export default function AdvisoryTopicBrowser({ heading, subheading, topics, disclaimer, allowVoice = true }: Props) {
  const { locale, voiceEnabled } = useSession();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results = useMemo(() => searchTopics(topics, query), [topics, query]);

  const toggle = (topic: AdvisoryTopic) => {
    const next = expandedId === topic.id ? null : topic.id;
    setExpandedId(next);
    if (next && voiceEnabled && allowVoice) {
      voiceService.speak(topicToSpokenText(topic), locale).catch(() => {});
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.subheading}>{subheading}</Text>

      <Disclaimer text={disclaimer} tone="warning" />

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="جستجو در موضوعات..."
        placeholderTextColor="#64748b"
      />

      <Text style={styles.resultCount}>{results.length} موضوع</Text>

      {results.map((topic) => {
        const expanded = expandedId === topic.id;
        return (
          <Pressable key={topic.id} style={styles.card} onPress={() => toggle(topic)}>
            <View style={styles.cardHeader}>
              <Text style={styles.dayBadge}>روز {topic.day}</Text>
              <Text style={styles.cardTitle}>{topic.title}</Text>
            </View>
            {expanded && (
              <View style={styles.cardBody}>
                <Text style={styles.hook}>{topic.hook}</Text>
                {topic.points.map((p, i) => (
                  <Text key={i} style={styles.point}>
                    • {p}
                  </Text>
                ))}
                <Text style={styles.cta}>{topic.cta}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {results.length === 0 && <Text style={styles.noneText}>چیزی با این عبارت پیدا نشد.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 4, paddingBottom: 48 },
  heading: { color: "#f8fafc", fontSize: 20, fontWeight: "700", textAlign: "right", marginBottom: 6 },
  subheading: { color: "#cbd5e1", fontSize: 13, lineHeight: 19, textAlign: "right", marginBottom: 8 },
  searchInput: {
    backgroundColor: "#1e293b",
    color: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: "right",
    marginTop: 8,
  },
  resultCount: { color: "#64748b", fontSize: 12, textAlign: "right", marginTop: 8, marginBottom: 4 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  cardHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  dayBadge: {
    color: "#1F9C94",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#0b2540",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  cardTitle: { color: "#f1f5f9", fontSize: 14, fontWeight: "700", textAlign: "right", flex: 1 },
  cardBody: { marginTop: 10, gap: 6 },
  hook: { color: "#cbd5e1", fontSize: 13, textAlign: "right", fontStyle: "italic" },
  point: { color: "#e2e8f0", fontSize: 13, textAlign: "right", lineHeight: 20 },
  cta: { color: "#E0A93B", fontSize: 12, textAlign: "right", marginTop: 6 },
  noneText: { color: "#94a3b8", fontSize: 13, textAlign: "right", marginTop: 20 },
});
