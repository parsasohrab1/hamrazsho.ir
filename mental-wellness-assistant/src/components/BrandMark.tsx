import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Segment, segmentById } from "@/config/segments";

/**
 * The brand mark: two overlapping rings (you + your confidant) whose shared
 * lens is the secret. Geometry mirrors brand/build_brand.py (100x100 box).
 *
 * When `active` is a content pillar the right ring takes that pillar's color,
 * so the mark still hints at where in the app you are; otherwise it is the
 * brand turquoise. `showLabel` is accepted for older call sites and ignored.
 */
export const MARK_GEOMETRY = {
  viewBox: 100,
  halfDistance: 11,
  radius: 23,
  stroke: 6.5,
  colors: { left: "#F7F1E3", right: "#2BB3AA", lens: "#E0A93B" },
};

interface Props {
  size?: number;
  active?: Segment | null;
  showLabel?: boolean;
  accessibilityLabel?: string;
}

const g = MARK_GEOMETRY;
const lensHalf = Math.sqrt(g.radius * g.radius - g.halfDistance * g.halfDistance);
const LENS = `M50 ${50 - lensHalf} A${g.radius} ${g.radius} 0 0 0 50 ${50 + lensHalf} A${g.radius} ${g.radius} 0 0 0 50 ${50 - lensHalf}Z`;

export default function BrandMark({ size = 32, active = null, accessibilityLabel }: Props) {
  const right = active ? segmentById(active).color : g.colors.right;
  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? (active ? segmentById(active).label.fa : undefined)}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${g.viewBox} ${g.viewBox}`}>
        <Path d={LENS} fill={g.colors.lens} />
        <Circle cx={50 - g.halfDistance} cy={50} r={g.radius} fill="none" stroke={g.colors.left} strokeWidth={g.stroke} />
        <Circle cx={50 + g.halfDistance} cy={50} r={g.radius} fill="none" stroke={right} strokeWidth={g.stroke} />
      </Svg>
    </View>
  );
}
