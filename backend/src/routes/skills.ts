import { Router } from "express";
import { prisma } from "@/lib/prisma";

/** Public, read-only advisory content — legal-consultation and
 *  mental-health-awareness topics. Unlike /data, this is NOT
 *  user-scoped: every caller sees the same shared reference library
 *  (see the SkillContent comment in schema.prisma), so no auth is
 *  required. The client also ships this exact content bundled locally
 *  (mental-wellness-assistant/src/data/legalTopics.ts and
 *  mentalHealthTopics.ts) and works fully offline without ever calling
 *  this route — it exists so content can be updated centrally later
 *  without an app-store release. */
export const skillsRouter = Router();

const KNOWN_SKILLS = ["legal", "mental_health"] as const;

skillsRouter.get("/", async (_req, res, next) => {
  try {
    const counts = await prisma.skillContent.groupBy({
      by: ["skill"],
      _count: { _all: true },
    });
    res.json({ skills: counts.map((c) => ({ skill: c.skill, topicCount: c._count._all })) });
  } catch (err) {
    next(err);
  }
});

skillsRouter.get("/:skill", async (req, res, next) => {
  try {
    const { skill } = req.params;
    if (!KNOWN_SKILLS.includes(skill as (typeof KNOWN_SKILLS)[number])) {
      res.status(404).json({ error: `Unknown skill '${skill}'` });
      return;
    }
    const topics = await prisma.skillContent.findMany({
      where: { skill },
      orderBy: { day: "asc" },
      select: { id: true, skill: true, day: true, title: true, hook: true, points: true, cta: true },
    });
    res.json({ skill, topics });
  } catch (err) {
    next(err);
  }
});
