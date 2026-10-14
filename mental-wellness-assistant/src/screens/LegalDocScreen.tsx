import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import LegalDocView from "@/components/LegalDocView";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@/data/legalDocs";

type Props = NativeStackScreenProps<RootStackParamList, "LegalDoc">;

export default function LegalDocScreen({ route }: Props) {
  return <LegalDocView doc={route.params.doc === "privacy" ? PRIVACY_POLICY : TERMS_OF_USE} />;
}
