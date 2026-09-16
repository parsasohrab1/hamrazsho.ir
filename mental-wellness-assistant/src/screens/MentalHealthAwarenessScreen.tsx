import React from "react";
import AdvisoryTopicBrowser from "@/components/AdvisoryTopicBrowser";
import { MENTAL_HEALTH_TOPICS } from "@/data/mentalHealthTopics";
import { DISCLAIMERS } from "@/data/disclaimers";

export default function MentalHealthAwarenessScreen() {
  return (
    <AdvisoryTopicBrowser
      heading="آگاهی از سلامت روان"
      subheading="نشانه‌های رایج مشکلات سلامت روان در خودتان و نزدیکان درجه‌یک — برای افزایش آگاهی، نه تشخیص."
      topics={MENTAL_HEALTH_TOPICS}
      disclaimer={DISCLAIMERS.mentalHealthAwarenessLimitations}
    />
  );
}
