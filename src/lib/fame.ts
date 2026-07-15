export interface FameTierInfo {
  tier: number;
  label: string;
}

// Thresholds are deliberately spaced wide — reaching Tier 5 should take a
// genuine career, not a handful of lucky weeks.
const FAME_TIERS: { min: number; tier: number; label: string }[] = [
  { min: 0, tier: 1, label: "Local Circuit" },
  { min: 50, tier: 2, label: "Regional Name" },
  { min: 150, tier: 3, label: "National Draw" },
  { min: 300, tier: 4, label: "International Star" },
  { min: 500, tier: 5, label: "Global Superstar" },
];

export function getFameTier(fame: number): FameTierInfo {
  let result = FAME_TIERS[0];
  for (const t of FAME_TIERS) {
    if (fame >= t.min) result = t;
  }
  return { tier: result.tier, label: result.label };
}

// ============================================
// FAME GAIN — applied to specific actions as they happen, never backfilled
// or recomputed from a formula. This is what keeps it from ever "glitching"
// for fighters who existed before some stat was tracked — fame only ever
// grows forward from real events.
// ============================================

export const FAME_GAIN = {
  win: 5,
  finish: 3, // additional, on top of the win bonus
  titleWin: 25, // becoming champion for the first time (or regaining it)
  titleDefense: 15,
  upset: 8, // beating a fighter ranked well above you
} as const;
