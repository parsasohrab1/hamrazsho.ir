import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEGAL_VERSION } from "@/data/legalDocs";

const KEY = "hamraz_consent_v1";

export interface ConsentRecord {
  version: string;
  acceptedAt: string;
  adultConfirmed: boolean;
}

/** A stored consent only counts if it was given for the current version
 *  of the terms/privacy text — bumping LEGAL_VERSION re-prompts everyone. */
export const isConsentCurrent = (c: ConsentRecord | null, version: string = LEGAL_VERSION): boolean =>
  Boolean(c && c.version === version && c.adultConfirmed);

/** null while loading from storage. */
export const useConsent = () => {
  const [record, setRecord] = useState<ConsentRecord | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        setRecord(raw ? (JSON.parse(raw) as ConsentRecord) : null);
      } catch {
        setRecord(null);
      }
    })();
  }, []);

  const accept = useCallback(async () => {
    const rec: ConsentRecord = { version: LEGAL_VERSION, acceptedAt: new Date().toISOString(), adultConfirmed: true };
    setRecord(rec);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(rec));
    } catch {
      // Still let the user in this session; they'll be asked again next launch.
    }
  }, []);

  return {
    loading: record === undefined,
    accepted: record === undefined ? false : isConsentCurrent(record),
    accept,
  };
};
