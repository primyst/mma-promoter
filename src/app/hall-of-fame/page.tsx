"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { Fighter } from "@/types/game";
import { ArrowLeft, Landmark, Crown } from "lucide-react";

interface LegendEntry {
  fighter: Fighter;
  titleReigns: number;
  totalDefenses: number;
  score: number;
}

export default function HallOfFameScreen() {
  const router = useRouter();
  const roster = useGameStore((s) => s.roster);
  const titleHistory = useGameStore((s) => s.titleHistory);

  const legends = useMemo<LegendEntry[]>(() => {
    return roster
      .filter((f) => f.isRetired)
      .map((fighter) => {
        const reigns = titleHistory.filter((t) => t.championId === fighter.id);
        const totalDefenses = reigns.reduce((sum, r) => sum + r.defenses, 0);
        // Simple legacy score: titles matter most, then defenses, then wins.
        const score = reigns.length * 100 + totalDefenses * 20 + fighter.wins * 2;
        return { fighter, titleReigns: reigns.length, totalDefenses, score };
      })
      .filter((entry) => entry.titleReigns > 0 || entry.fighter.wins >= 10)
      .sort((a, b) => b.score - a.score);
  }, [roster, titleHistory]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Landmark className="w-4 h-4 text-yellow-500" /> Hall of Fame
          </h1>
          <p className="text-xs text-neutral-500">Retired legends of the promotion</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {legends.length === 0 && (
          <p className="text-sm text-neutral-500 text-center mt-8">
            No legends yet — champions and decorated veterans will land here once they retire.
          </p>
        )}

        {legends.map((entry, i) => (
          <div
            key={entry.fighter.id}
            className="flex items-center justify-between bg-neutral-900 border border-yellow-700/30 rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-neutral-600 w-5 shrink-0">#{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                  {entry.fighter.countryFlag} {entry.fighter.name}
                  {entry.titleReigns > 0 && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  )}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {entry.fighter.weightClass} · {entry.fighter.wins}-{entry.fighter.losses}-
                  {entry.fighter.draws}
                  {entry.titleReigns > 0 &&
                    ` · ${entry.titleReigns} title reign${entry.titleReigns !== 1 ? "s" : ""}, ${entry.totalDefenses} defense${entry.totalDefenses !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
