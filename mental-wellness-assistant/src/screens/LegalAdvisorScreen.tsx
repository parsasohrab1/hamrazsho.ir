import React from "react";
import AdvisoryTopicBrowser from "@/components/AdvisoryTopicBrowser";
import { LEGAL_TOPICS } from "@/data/legalTopics";
import { DISCLAIMERS } from "@/data/disclaimers";

export default function LegalAdvisorScreen() {
  return (
    <AdvisoryTopicBrowser
      heading="مشاور حقوقی"
      subheading="یک کتابخانهٔ کوچک از توضیحات عمومی دربارهٔ موضوعات رایج حقوقی — نه مشاورهٔ اختصاصی یا نمایندگی وکالتی."
      topics={LEGAL_TOPICS}
      disclaimer={DISCLAIMERS.legalAdvisorLimitations}
    />
  );
}
