import { Fighter } from "@/types/game";

export interface MoraleDisplay {
  percent: number;
  label: string;
  colorClass: string; // text color for the percentage
  barColorClass: string; // background color for a progress bar, if used
}

/**
 * Converts the underlying momentum enum (hot/neutral/cold — which still
 * drives fight sim scoring) into a morale percentage for display purposes
 * only. Kept as a display-layer mapping rather than replacing the enum
 * itself, since momentum is wired into fight outcome math elsewhere.
 */
export function getMoraleDisplay(momentum: Fighter["momentum"]): MoraleDisplay {
  if (momentum === "hot") {
    return {
      percent: 80,
      label: "High Morale",
      colorClass: "text-green-500",
      barColorClass: "bg-green-500",
    };
  }
  if (momentum === "cold") {
    return {
      percent: 25,
      label: "Low Morale",
      colorClass: "text-red-500",
      barColorClass: "bg-red-500",
    };
  }
  return {
    percent: 50,
    label: "Steady",
    colorClass: "text-neutral-400",
    barColorClass: "bg-neutral-500",
  };
}
