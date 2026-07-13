"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import {
  getMostWins,
  getBestRecord,
  getMostFinishes,
  getMostTitleDefenses,
  getMostFanHeat,
  getLongestReign,
  LeaderboardEntry,
} from "@/lib/records";
import { ArrowLeft, Medal } from "lucide-react";

// ============================================
// CATEGORY CONFIG
// ============================================

type Category =
  | "wins"
  | "record"
  | "finishes"
  | "defenses"
  | "heat"
  | "reign";

const CATEGORIES: { label: string; value: Category }[] = [
  { label: "Most Wins", value: "wins" },
  { label: "Best Record", value: "record" },
  { label: "Finishes", value: "finishes" },
  { label: "Title Defenses", value: "defenses" },
  { label: "Fan Heat", value: "heat" },
  { label: "Longest Reign", value: "reign" },
];

// ============================================
// MEDAL COLORS FOR TOP 3
// ============================================

function medalColor(index: number): string {
  if (index === 0) return "text-yellow-500";
  if (index === 1) return "text-neutral-300";
  if (index === 2) return "text-amber-700";
  return "text-neutral-600";
}

// ============================================
// MAIN SCREEN
// ============================================

export default function RecordsScreen() {
  const router = useRouter();
  const roster = useGameStore((s) => s.roster);
  const titleHistory = useGameStore((s) => s.titleHistory);
  const promotion = useGameStore((s) => s.promotion);
  const [category, setCategory] = useState<Category>("wins");

  const entries: LeaderboardEntry[] = useMemo(() => {
    switch (category) {
      case "wins":
        return getMostWins(roster);
      case "record":
        return getBestRecord(roster);
      case "finishes":
        return getMostFinishes(roster);
      case "defenses":
        return getMostTitleDefenses(titleHistory);
      case "heat":
        return getMostFanHeat(roster);
      case "reign":
        return getLongestReign(titleHistory, promotion.currentWeek);
      default:
        return [];
    }
  }, [category, roster, titleHistory, promotion.currentWeek]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Records</h1>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
              category === cat.value
                ? "bg-white text-black border-white"
                : "border-neutral-700 text-neutral-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {entries.length === 0 && (
          <p className="text-sm text-neutral-500 text-center mt-12">
            No records yet — book some cards first.
          </p>
        )}
        {entries.map((entry, index) => (
          <button
            key={entry.fighterId + index}
            onClick={() => router.push(`/fighter/${entry.fighterId}`)}
            className="w-full flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Medal className={`w-4 h-4 ${medalColor(index)}`} />
              <span className="text-xs text-neutral-500 w-4">{index + 1}</span>
              <span className="font-medium text-sm">{entry.fighterName}</span>
            </div>
            <span className="text-xs text-neutral-400">{entry.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
