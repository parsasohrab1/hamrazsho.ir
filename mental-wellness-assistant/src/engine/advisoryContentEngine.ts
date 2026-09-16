import { AdvisoryTopic } from "@/types";

/**
 * Search/browse logic shared by the legal-advisor and mental-health-
 * awareness skills — both are the same shape of thing: a small, curated,
 * pre-written topic library the user browses or searches by keyword,
 * not a live Q&A with a real professional. See searchTopics's callers
 * (LegalAdvisorScreen, MentalHealthAwarenessScreen) and the matching
 * DISCLAIMERS entries.
 */
export const searchTopics = (topics: AdvisoryTopic[], query: string): AdvisoryTopic[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return topics;
  return topics.filter((t) => {
    const haystack = `${t.title} ${t.hook} ${t.points.join(" ")}`.toLowerCase();
    return haystack.includes(trimmed);
  });
};

export const getTopicById = (topics: AdvisoryTopic[], id: string): AdvisoryTopic | null =>
  topics.find((t) => t.id === id) ?? null;

/** A short, speakable summary for voiceService.speak — title + hook + points. */
export const topicToSpokenText = (topic: AdvisoryTopic): string =>
  [topic.title, topic.hook, ...topic.points].join(". ");
