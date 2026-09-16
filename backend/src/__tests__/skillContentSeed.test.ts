import { LEGAL_SEED } from "@/data/legalTopicsSeed";
import { MENTAL_HEALTH_SEED } from "@/data/mentalHealthTopicsSeed";

describe("skill content seed data", () => {
  it("has exactly 30 days each, numbered 1..30 with no gaps or duplicates", () => {
    for (const rows of [LEGAL_SEED, MENTAL_HEALTH_SEED]) {
      expect(rows).toHaveLength(30);
      const days = rows.map((r) => r.day).sort((a, b) => a - b);
      expect(days).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    }
  });

  it("tags rows with the matching skill name", () => {
    expect(LEGAL_SEED.every((r) => r.skill === "legal")).toBe(true);
    expect(MENTAL_HEALTH_SEED.every((r) => r.skill === "mental_health")).toBe(true);
  });

  it("gives every row a non-empty title, hook, points list, and CTA", () => {
    for (const r of [...LEGAL_SEED, ...MENTAL_HEALTH_SEED]) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.hook.length).toBeGreaterThan(0);
      expect(r.points.length).toBeGreaterThan(0);
      expect(r.cta.length).toBeGreaterThan(0);
    }
  });
});
