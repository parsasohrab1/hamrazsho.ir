import type { FeatureId } from "@/config/features";

/**
 * The six content pillars shown as the six circles of the brand mark
 * (src/components/BrandMark.tsx). Whenever the app knows what the current
 * content is about, only that pillar's circle is drawn in color and the
 * others are grayscale; when it doesn't (home screen), all six are
 * in color.
 */
export type Segment = "mind" | "family" | "legal" | "business" | "academic" | "sport";

export interface SegmentDef {
  id: Segment;
  label: { fa: string; en: string };
  /** Fits inside the circle of the brand mark. */
  shortLabel: string;
  color: string;
  /** Luminance-matched gray, so an inactive circle keeps its visual weight. */
  gray: string;
}

export const SEGMENTS: SegmentDef[] = [
  { id: "mind", shortLabel: "روح و روان", label: { fa: "مشاوره روح و روان", en: "Mind & wellbeing" }, color: "#1F9C94", gray: "#8A8A8A" },
  { id: "family", shortLabel: "خانواده", label: { fa: "مشاوره خانواده (دوستی، ازدواج و …)", en: "Family & relationships" }, color: "#E0A93B", gray: "#B4B4B4" },
  { id: "legal", shortLabel: "حقوقی", label: { fa: "مشاوره حقوقی", en: "Legal" }, color: "#E4577B", gray: "#8F8F8F" },
  { id: "business", shortLabel: "کسب‌وکار", label: { fa: "مشاوره کسب‌وکار", en: "Business & career" }, color: "#6366F1", gray: "#707070" },
  { id: "academic", shortLabel: "تحصیلی", label: { fa: "مشاوره تحصیلی", en: "Academic" }, color: "#22C55E", gray: "#A0A0A0" },
  { id: "sport", shortLabel: "ورزشی", label: { fa: "مشاوره ورزشی", en: "Sport & fitness" }, color: "#38BDF8", gray: "#9A9A9A" },
];

export const segmentById = (id: Segment): SegmentDef => SEGMENTS.find((s) => s.id === id)!;

/** Which pillar each feature belongs to. Features not listed (e.g. recipes,
 *  style) aren't one of the four pillars, so the mark stays fully colored. */
export const FEATURE_SEGMENT: Partial<Record<FeatureId, Segment>> = {
  screening: "mind",
  companion: "mind",
  mentalHealth: "mind",
  activeListening: "mind",
  quitCoach: "mind",
  fitness: "sport",
  music: "mind",
  counseling: "family",
  storytelling: "family",
  family: "family",
  social: "family",
  gift: "family",
  career: "business",
  legal: "legal",
  tasks: "business",
};

/** Screens that aren't a home-screen feature themselves but clearly belong
 *  to a pillar (result/sub-screens, the crisis flow). */
const ROUTE_SEGMENT: Record<string, Segment> = {
  Crisis: "mind",
  Screening: "mind",
  Results: "mind",
  Welcome: "mind",
  FitnessResults: "sport",
  CounselingResults: "family",
  RelationshipSafety: "family",
  StoryPlayback: "family",
};

export const segmentForRoute = (route: string, featureForRoute: (r: string) => FeatureId | undefined): Segment | null => {
  if (ROUTE_SEGMENT[route]) return ROUTE_SEGMENT[route];
  const f = featureForRoute(route);
  return (f && FEATURE_SEGMENT[f]) || null;
};
