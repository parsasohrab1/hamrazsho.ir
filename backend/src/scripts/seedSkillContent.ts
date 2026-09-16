import { prisma } from "@/lib/prisma";
import { LEGAL_SEED } from "@/data/legalTopicsSeed";
import { MENTAL_HEALTH_SEED } from "@/data/mentalHealthTopicsSeed";

/** Upserts the legal + mental-health advisory content into SkillContent.
 *  Safe to re-run — matches on the (skill, day) unique key, so re-seeding
 *  after editing the source data updates existing rows instead of
 *  duplicating them. Run with: npm run seed:skills */
async function main() {
  const rows = [...LEGAL_SEED, ...MENTAL_HEALTH_SEED];
  for (const row of rows) {
    await prisma.skillContent.upsert({
      where: { skill_day: { skill: row.skill, day: row.day } },
      update: { title: row.title, hook: row.hook, points: row.points, cta: row.cta },
      create: row,
    });
  }
  console.log(`Seeded ${rows.length} skill-content rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
