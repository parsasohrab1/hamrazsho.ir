import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FeatureDef, canUseFeature, isFeatureVisible } from "@/config/features";
import { PREMIUM_MODE } from "@/config/release";
import { usePremium } from "@/state/PremiumContext";
import { recordFeatureUse, usageOf } from "@/state/useFeatureUsage";

/**
 * Route-level guard. The home screen already sends locked features to the
 * paywall, but screens are also reachable through cross-links (e.g. the
 * companion suggests "recipes") — this makes the rule hold for every
 * entry point instead of trusting each caller to check.
 *
 * `countsAsUse`: true for a feature's entry screen, which consumes one of
 * the monthly free uses of a "trial" feature; false for its sub-screens
 * (e.g. Cooking after Recipes), so one session isn't counted twice.
 */
export function withFeatureGate<P extends object>(feature: FeatureDef, Screen: React.ComponentType<P>, countsAsUse = true) {
  function Gated(props: P) {
    const { isPremium } = usePremium();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const visible = isFeatureVisible(feature);
    // Decided once on entry, so spending the 10th free visit doesn't kick
    // the user out of the screen they're already on.
    const [allowedOnEntry] = useState(
      () => visible && canUseFeature(feature, isPremium, PREMIUM_MODE, countsAsUse ? usageOf(feature.id) : 0)
    );
    const allowed = allowedOnEntry || (visible && isPremium);
    const counted = useRef(false);

    useEffect(() => {
      if (!allowed) {
        if (!visible) navigation.replace("Home");
        else navigation.replace("Paywall", { featureId: feature.id });
        return;
      }
      const metered = feature.tier === "trial" && !isPremium && PREMIUM_MODE === "billing";
      if (countsAsUse && metered && !counted.current) {
        counted.current = true;
        recordFeatureUse(feature.id);
      }
    }, [allowed, visible, isPremium, navigation]);

    if (!allowed) return <View style={{ flex: 1 }} />;
    return <Screen {...props} />;
  }
  Gated.displayName = `Gated(${feature.id})`;
  return Gated;
}
