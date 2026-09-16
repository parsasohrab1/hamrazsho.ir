-- CreateTable
CREATE TABLE "skill_content" (
    "id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "cta" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_content_skill_idx" ON "skill_content"("skill");

-- CreateIndex
CREATE UNIQUE INDEX "skill_content_skill_day_key" ON "skill_content"("skill", "day");
