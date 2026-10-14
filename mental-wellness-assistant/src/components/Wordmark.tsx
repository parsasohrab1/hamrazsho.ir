import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { WORDMARK } from "@/config/brandWordmark";
import { BRAND } from "@/config/brand";

interface Props {
  /** Rendered height in px; width follows the wordmark's aspect ratio. */
  height?: number;
  color?: string;
  dotColor?: string;
}

/** The outlined Persian brand name (the dot of its last letter is gold). */
export default function Wordmark({ height = 28, color = "#F7F1E3", dotColor = "#E0A93B" }: Props) {
  const width = (WORDMARK.width / WORDMARK.height) * height;
  return (
    <View style={{ width, height }} accessible accessibilityRole="header" accessibilityLabel={BRAND.name.fa}>
      <Svg width={width} height={height} viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}>
        <Path d={WORDMARK.body} fill={color} />
        <Path d={WORDMARK.dot} fill={dotColor} />
      </Svg>
    </View>
  );
}
