import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { WEB_FULL_APP } from "@/config/release";
import { loadVoiceProfile } from "@/state/useVoiceProfile";
import { loadFeatureUsage } from "@/state/useFeatureUsage";
import WebSite from "@/web/WebSite";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/state/AuthContext";
import { PremiumProvider } from "@/state/PremiumContext";
import { SessionProvider } from "@/state/SessionContext";
import { CookingProvider } from "@/state/CookingContext";
import { StoryProvider } from "@/state/StoryContext";
import { CounselingProvider } from "@/state/CounselingContext";
import { FitnessProvider } from "@/state/FitnessContext";
import { StyleProvider } from "@/state/StyleContext";
import { useConsent } from "@/state/useConsent";
import RootNavigator from "@/navigation/RootNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import { BRAND } from "@/config/brand";

function Gate() {
  const { loading, accepted, accept } = useConsent();
  const [voiceLoaded, setVoiceLoaded] = useState(false);
  useEffect(() => {
    Promise.all([loadVoiceProfile(), loadFeatureUsage()]).finally(() => setVoiceLoaded(true));
  }, []);
  if (loading || !voiceLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: BRAND.colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={BRAND.colors.primary} />
      </View>
    );
  }
  if (!accepted) return <OnboardingScreen onAccept={accept} />;
  return <RootNavigator />;
}

export default function App() {
  // Product decision: the web build is a read-only showcase site; the
  // voice assistant lives only in the mobile apps.
  if (Platform.OS === "web" && !WEB_FULL_APP) {
    return (
      <ErrorBoundary>
        <SessionProvider>
          <StatusBar style="light" />
          <WebSite />
        </SessionProvider>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PremiumProvider>
          <SessionProvider>
            <CookingProvider>
              <StoryProvider>
                <CounselingProvider>
                  <FitnessProvider>
                    <StyleProvider>
                      <StatusBar style="light" />
                      <Gate />
                    </StyleProvider>
                  </FitnessProvider>
                </CounselingProvider>
              </StoryProvider>
            </CookingProvider>
          </SessionProvider>
        </PremiumProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
