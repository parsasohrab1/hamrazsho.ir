import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "@/screens/WelcomeScreen";
import ScreeningScreen from "@/screens/ScreeningScreen";
import ResultsScreen from "@/screens/ResultsScreen";
import CrisisScreen from "@/screens/CrisisScreen";
import MusicScreen from "@/screens/MusicScreen";
import FavoriteMusicScreen from "@/screens/FavoriteMusicScreen";
import RecipeScreen from "@/screens/RecipeScreen";
import CookingScreen from "@/screens/CookingScreen";
import StorytellingScreen from "@/screens/StorytellingScreen";
import StoryPlaybackScreen from "@/screens/StoryPlaybackScreen";
import CounselingScreen from "@/screens/CounselingScreen";
import CounselingResultsScreen from "@/screens/CounselingResultsScreen";
import RelationshipSafetyScreen from "@/screens/RelationshipSafetyScreen";
import FitnessScreen from "@/screens/FitnessScreen";
import FitnessResultsScreen from "@/screens/FitnessResultsScreen";
import ActiveListeningScreen from "@/screens/ActiveListeningScreen";
import StyleAdvisorScreen from "@/screens/StyleAdvisorScreen";
import StyleResultsScreen from "@/screens/StyleResultsScreen";
import CompanionScreen from "@/screens/CompanionScreen";
import QuitCoachScreen from "@/screens/QuitCoachScreen";
import CareerCoachScreen from "@/screens/CareerCoachScreen";
import SongIdScreen from "@/screens/SongIdScreen";
import SocialAdvisorScreen from "@/screens/SocialAdvisorScreen";
import GiftAdvisorScreen from "@/screens/GiftAdvisorScreen";
import FamilyCircleScreen from "@/screens/FamilyCircleScreen";
import PersonalTasksScreen from "@/screens/PersonalTasksScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import LoginScreen from "@/screens/LoginScreen";
import LegalAdvisorScreen from "@/screens/LegalAdvisorScreen";
import MentalHealthAwarenessScreen from "@/screens/MentalHealthAwarenessScreen";
import HomeScreen from "@/screens/HomeScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import LegalDocScreen from "@/screens/LegalDocScreen";
import { PersonalityTrait, SocialRelation } from "@/types";
import { BRAND } from "@/config/brand";
import { FeatureId, featureById } from "@/config/features";
import { withFeatureGate } from "@/components/PremiumGate";
import BrandMark from "@/components/BrandMark";
import { segmentForRoute } from "@/config/segments";
import { featureByRoute } from "@/config/features";
import { screenIntro } from "@/engine/greetingEngine";
import { queueIntro } from "@/voice/voiceService";
import { useSession } from "@/state/SessionContext";

// Route-level gates (premium + demo-only). Sub-screens share their parent
// feature's gate so a deep link can't skip the paywall.
const gate = <P extends object>(id: FeatureId, C: React.ComponentType<P>, countsAsUse = true) =>
  withFeatureGate(featureById(id), C, countsAsUse);
const G = {
  Music: gate("music", MusicScreen),
  FavoriteMusic: gate("favoriteMusic", FavoriteMusicScreen),
  SongId: gate("songId", SongIdScreen),
  Recipes: gate("recipes", RecipeScreen),
  Cooking: gate("recipes", CookingScreen, false),
  StyleAdvisor: gate("style", StyleAdvisorScreen),
  StyleResults: gate("style", StyleResultsScreen, false),
  CareerCoach: gate("career", CareerCoachScreen),
  SocialAdvisor: gate("social", SocialAdvisorScreen),
  GiftAdvisor: gate("gift", GiftAdvisorScreen),
  FamilyCircle: gate("family", FamilyCircleScreen),
  PersonalTasks: gate("tasks", PersonalTasksScreen),
  LegalAdvisor: gate("legal", LegalAdvisorScreen),
};

export type RootStackParamList = {
  Home: undefined;
  Paywall: { featureId?: FeatureId } | undefined;
  LegalDoc: { doc: "privacy" | "terms" };
  Welcome: undefined;
  Screening: undefined;
  Results: undefined;
  Crisis: undefined;
  Music: undefined;
  FavoriteMusic: undefined;
  Recipes: undefined;
  Cooking: undefined;
  Storytelling: undefined;
  StoryPlayback: undefined;
  Counseling: undefined;
  CounselingResults: undefined;
  RelationshipSafety: undefined;
  Fitness: undefined;
  FitnessResults: undefined;
  ActiveListening: undefined;
  StyleAdvisor: undefined;
  StyleResults: undefined;
  Companion: undefined;
  QuitCoach: undefined;
  CareerCoach: undefined;
  SongId: undefined;
  SocialAdvisor:
    | { presetRelation?: SocialRelation; presetTraits?: PersonalityTrait[]; presetName?: string }
    | undefined;
  FamilyCircle: undefined;
  GiftAdvisor: undefined;
  PersonalTasks: undefined;
  Settings: undefined;
  Login: undefined;
  LegalAdvisor: undefined;
  MentalHealthAwareness: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const segmentOf = (route: string) => segmentForRoute(route, (r) => featureByRoute(r)?.id);

export default function RootNavigator() {
  const { voiceEnabled } = useSession();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: BRAND.colors.background },
          headerTintColor: BRAND.colors.text,
          contentStyle: { backgroundColor: BRAND.colors.background },
          // The segmented mark: only the circle for this screen's pillar is colored.
          headerRight: () => <BrandMark size={64} active={segmentOf(route.name)} />,
        })}
        screenListeners={({ route }) => ({
          // Friendly spoken one-liner when a section opens (see greetingEngine).
          focus: () => {
            if (!voiceEnabled) return;
            const line = screenIntro(route.name);
            if (line) queueIntro(line);
          },
        })}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: BRAND.name.fa, headerShown: false }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: "اشتراک ویژه" }} />
        <Stack.Screen name="LegalDoc" component={LegalDocScreen} options={{ title: "" }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: "خودارزیابی حال روان" }} />
        <Stack.Screen name="Screening" component={ScreeningScreen} options={{ title: "گفتگوی غربالگری" }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: "نتیجه" }} />
        <Stack.Screen
          name="Crisis"
          component={CrisisScreen}
          options={{ title: "کمک فوری", gestureEnabled: false }}
        />
        <Stack.Screen name="Music" component={G.Music} options={{ title: "موسیقی آرام‌بخش" }} />
        <Stack.Screen
          name="FavoriteMusic"
          component={G.FavoriteMusic}
          options={{ title: "موسیقی مورد علاقه" }}
        />
        <Stack.Screen name="Recipes" component={G.Recipes} options={{ title: "رسپی‌های جهانی" }} />
        <Stack.Screen
          name="Cooking"
          component={G.Cooking}
          options={{ title: "راهنمای گام‌به‌گام پخت" }}
        />
        <Stack.Screen
          name="Storytelling"
          component={StorytellingScreen}
          options={{ title: "قصه برای کودکان" }}
        />
        <Stack.Screen
          name="StoryPlayback"
          component={StoryPlaybackScreen}
          options={{ title: "قصه‌گویی", gestureEnabled: false }}
        />
        <Stack.Screen
          name="Counseling"
          component={CounselingScreen}
          options={{ title: "مشاورهٔ زناشویی" }}
        />
        <Stack.Screen
          name="CounselingResults"
          component={CounselingResultsScreen}
          options={{ title: "راهکارهای پیشنهادی" }}
        />
        <Stack.Screen
          name="RelationshipSafety"
          component={RelationshipSafetyScreen}
          options={{ title: "ایمنی رابطه", gestureEnabled: false }}
        />
        <Stack.Screen name="Fitness" component={FitnessScreen} options={{ title: "تغذیه و تناسب اندام" }} />
        <Stack.Screen
          name="FitnessResults"
          component={FitnessResultsScreen}
          options={{ title: "نتیجهٔ BMI" }}
        />
        <Stack.Screen
          name="ActiveListening"
          component={ActiveListeningScreen}
          options={{ title: "گوش فعال" }}
        />
        <Stack.Screen
          name="StyleAdvisor"
          component={G.StyleAdvisor}
          options={{ title: "مشاور استایل" }}
        />
        <Stack.Screen
          name="StyleResults"
          component={G.StyleResults}
          options={{ title: "پیشنهاد استایل" }}
        />
        <Stack.Screen name="Companion" component={CompanionScreen} options={{ title: "رفیق همراه" }} />
        <Stack.Screen name="QuitCoach" component={QuitCoachScreen} options={{ title: "ترک عادت" }} />
        <Stack.Screen name="CareerCoach" component={G.CareerCoach} options={{ title: "مشاور شغلی" }} />
        <Stack.Screen name="SongId" component={G.SongId} options={{ title: "پیدا کردن آهنگ" }} />
        <Stack.Screen name="SocialAdvisor" component={G.SocialAdvisor} options={{ title: "مشاور موقعیت‌های اجتماعی" }} />
        <Stack.Screen name="GiftAdvisor" component={G.GiftAdvisor} options={{ title: "پیدا کردن هدیه" }} />
        <Stack.Screen name="FamilyCircle" component={G.FamilyCircle} options={{ title: "خانواده و اطرافیان" }} />
        <Stack.Screen name="PersonalTasks" component={G.PersonalTasks} options={{ title: "کارهای شخصی" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "تنظیمات" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "ورود" }} />
        <Stack.Screen name="LegalAdvisor" component={G.LegalAdvisor} options={{ title: "مشاور حقوقی" }} />
        <Stack.Screen
          name="MentalHealthAwareness"
          component={MentalHealthAwarenessScreen}
          options={{ title: "آگاهی از سلامت روان" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
