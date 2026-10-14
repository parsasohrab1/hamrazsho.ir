import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeatureId } from "@/config/features";
import { jalaliMonthKey } from "@/utils/jalali";

/**
 * Per-device count of how many times each "trial" feature has been opened
 * THIS solar Hijri month (see FREE_TRIAL_USES in config/features.ts). The
 * counters reset automatically on the 1st of every Persian month.
 *
 * Known limitation, stated plainly: the count lives on the device, so
 * clearing app data or reinstalling resets it. That's an acceptable
 * trade-off for a generous free trial; moving the counter server-side
 * would require an account, which the app deliberately never forces.
 */
const KEY = "hamraz_feature_usage_v1";

let month = jalaliMonthKey();
let counts: Partial<Record<FeatureId, number>> = {};

/** Pure — exported for tests: stored counters only count for their month. */
export const countsForMonth = (
  stored: { month?: string; counts?: Partial<Record<FeatureId, number>> } | null,
  currentMonth: string
): Partial<Record<FeatureId, number>> => (stored && stored.month === currentMonth && stored.counts ? stored.counts : {});

/** Called before every read/write so an app left open across the month
 *  boundary still resets. */
const rollOver = () => {
  const now = jalaliMonthKey();
  if (now !== month) {
    month = now;
    counts = {};
  }
};
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const loadFeatureUsage = async (): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    month = jalaliMonthKey();
    counts = countsForMonth(raw ? JSON.parse(raw) : null, month);
  } catch {
    counts = {};
  }
  emit();
};

export const usageOf = (id: FeatureId): number => {
  rollOver();
  return counts[id] ?? 0;
};

export const recordFeatureUse = async (id: FeatureId): Promise<void> => {
  counts = { ...counts, [id]: usageOf(id) + 1 };
  emit();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ month, counts }));
  } catch {
    // best effort
  }
};

/** Re-renders on every change; returns a reader for the current month. */
export const useFeatureUsage = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return usageOf;
};
