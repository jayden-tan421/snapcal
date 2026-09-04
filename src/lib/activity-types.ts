/**
 * Suggested activity types with a rough calories-burned-per-minute rate
 * (MET-based, for a ~70kg reference adult) used only to pre-fill the
 * calories field when logging an activity — the user can always edit the
 * number afterward, same as AI-analyzed meal items are editable.
 */
export interface ActivityTypeOption {
  value: string;
  label: string;
  kcalPerMinute: number;
}

export const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { value: "walking", label: "Walking", kcalPerMinute: 4 },
  { value: "running", label: "Running / jogging", kcalPerMinute: 11 },
  { value: "cycling", label: "Cycling", kcalPerMinute: 9 },
  { value: "swimming", label: "Swimming", kcalPerMinute: 7 },
  { value: "strength_training", label: "Strength training", kcalPerMinute: 6 },
  { value: "yoga", label: "Yoga / stretching", kcalPerMinute: 4 },
  { value: "basketball", label: "Basketball", kcalPerMinute: 10 },
  { value: "soccer", label: "Soccer / football", kcalPerMinute: 9 },
  { value: "badminton", label: "Badminton", kcalPerMinute: 7 },
  { value: "hiking", label: "Hiking", kcalPerMinute: 7 },
  { value: "dancing", label: "Dancing", kcalPerMinute: 6 },
  { value: "hiit", label: "HIIT", kcalPerMinute: 10 },
  { value: "other", label: "Other", kcalPerMinute: 7 },
];

export function activityTypeLabel(value: string): string {
  return ACTIVITY_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** A rough starting estimate — always meant to be edited, never final. */
export function estimateCaloriesBurned(
  activityTypeValue: string,
  durationMinutes: number
): number {
  const rate =
    ACTIVITY_TYPES.find((t) => t.value === activityTypeValue)?.kcalPerMinute ?? 7;
  return Math.round(rate * durationMinutes);
}
