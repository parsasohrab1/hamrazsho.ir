import { getTopicById, searchTopics, topicToSpokenText } from "@/engine/advisoryContentEngine";
import { LEGAL_TOPICS } from "@/data/legalTopics";
import { MENTAL_HEALTH_TOPICS } from "@/data/mentalHealthTopics";
import { AdvisoryTopic } from "@/types";

describe("legal and mental-health topic data", () => {
  it("has exactly 30 days each, numbered 1..30 with no gaps or duplicates", () => {
    for (const topics of [LEGAL_TOPICS, MENTAL_HEALTH_TOPICS]) {
      expect(topics).toHaveLength(30);
      const days = topics.map((t) => t.day).sort((a, b) => a - b);
      expect(days).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    }
  });

  it("has unique, non-empty ids across both skills", () => {
    const all = [...LEGAL_TOPICS, ...MENTAL_HEALTH_TOPICS];
    const ids = all.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it("tags every legal topic with skill 'legal' and every mental-health topic with 'mental_health'", () => {
    expect(LEGAL_TOPICS.every((t) => t.skill === "legal")).toBe(true);
    expect(MENTAL_HEALTH_TOPICS.every((t) => t.skill === "mental_health")).toBe(true);
  });

  it("gives every topic at least a title, hook, one point, and a CTA", () => {
    for (const t of [...LEGAL_TOPICS, ...MENTAL_HEALTH_TOPICS]) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.hook.length).toBeGreaterThan(0);
      expect(t.points.length).toBeGreaterThan(0);
      expect(t.cta.length).toBeGreaterThan(0);
    }
  });
});

describe("searchTopics", () => {
  it("returns everything for an empty query", () => {
    expect(searchTopics(LEGAL_TOPICS, "")).toHaveLength(LEGAL_TOPICS.length);
    expect(searchTopics(LEGAL_TOPICS, "   ")).toHaveLength(LEGAL_TOPICS.length);
  });

  it("matches a keyword found only in the title", () => {
    const results = searchTopics(LEGAL_TOPICS, "مهریه");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((t) => `${t.title} ${t.hook} ${t.points.join(" ")}`.includes("مهریه"))).toBe(true);
  });

  it("matches a keyword found only inside the points list", () => {
    const results = searchTopics(MENTAL_HEALTH_TOPICS, "PTSD");
    expect(results.some((t) => t.points.some((p) => p.includes("PTSD")))).toBe(true);
  });

  it("returns nothing for a nonsense query", () => {
    expect(searchTopics(LEGAL_TOPICS, "xyzxyzxyz_not_a_real_word")).toHaveLength(0);
  });
});

describe("getTopicById", () => {
  it("finds an existing topic", () => {
    const first = LEGAL_TOPICS[0];
    expect(getTopicById(LEGAL_TOPICS, first.id)).toEqual(first);
  });

  it("returns null for a missing id", () => {
    expect(getTopicById(LEGAL_TOPICS, "does_not_exist")).toBeNull();
  });
});

describe("topicToSpokenText", () => {
  it("joins title, hook, and every point into one string", () => {
    const topic: AdvisoryTopic = {
      id: "t1",
      skill: "legal",
      day: 1,
      title: "Title",
      hook: "Hook",
      points: ["Point A", "Point B"],
      cta: "CTA",
    };
    expect(topicToSpokenText(topic)).toBe("Title. Hook. Point A. Point B");
  });
});
