"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { Fighter, WeightClass } from "@/types/game";
import { ArrowLeft, Crown, Swords } from "lucide-react";

export default function RivalScreen() {
  const router = useRouter();
  const rival = useGameStore((s) => s.rival);

  const byDivision = useMemo(() => {
    const map = new Map<WeightClass, Fighter[]>();
    for (const f of rival.roster) {
      if (f.isRetired) continue;
      map.set(f.weightClass, [...(map.get(f.weightClass) ?? []), f]);
    }
    // Simple standings within each division — best record first, Elo breaks ties.
    for (const [wc, fighters] of map) {
      map.set(
        wc,
        [...fighters].sort((a, b) => {
          const recordA = a.wins - a.losses;
          const recordB = b.wins - b.losses;
          return recordB !== recordA ? recordB - recordA : b.eloRating - a.eloRating;
        })
      );
    }
    return map;
  }, [rival.roster]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Swords className="w-4 h-4 text-neutral-500" /> {rival.name}
          </h1>
          <p className="text-xs text-neutral-500">
            {rival.abbreviation} · Rival Promotion · {rival.roster.length} fighters signed
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {rival.roster.length === 0 && (
          <p className="text-sm text-neutral-500 text-center mt-8">
            No signed fighters yet.
          </p>
        )}

        {[...byDivision.entries()].map(([weightClass, fighters]) => (
          <div key={weightClass}>
            <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
              {weightClass}
            </h2>
            <div className="space-y-1.5">
              {fighters.map((fighter, i) => (
                <div
                  key={fighter.id}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-neutral-600 w-5 shrink-0">
                      {i === 0 ? <Crown className="w-3.5 h-3.5 text-yellow-500" /> : `#${i + 1}`}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {fighter.countryFlag} {fighter.name}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 shrink-0 ml-2">
                    {fighter.wins}-{fighter.losses}-{fighter.draws}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
