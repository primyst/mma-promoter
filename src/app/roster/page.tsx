"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { Fighter, WeightClass } from "@/types/game";
import {
  Crown,
  Flame,
  Snowflake,
  Minus,
  HeartPulse,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================
// STATUS HELPERS
// ============================================

function MomentumIcon({ momentum }: { momentum: Fighter["momentum"] }) {
  if (momentum === "hot") return <Flame className="w-3.5 h-3.5 text-orange-500" />;
  if (momentum === "cold") return <Snowflake className="w-3.5 h-3.5 text-blue-400" />;
  return <Minus className="w-3.5 h-3.5 text-neutral-500" />;
}

function statusLabel(fighter: Fighter): { text: string; color: string } {
  if (fighter.isRetired) return { text: "Retired", color: "text-neutral-600" };
  if (fighter.health === "injured")
    return { text: `Injured · ${fighter.weeksUntilAvailable}w`, color: "text-red-500" };
  if (fighter.weeksUntilAvailable > 0)
    return { text: `Cooldown · ${fighter.weeksUntilAvailable}w`, color: "text-yellow-500" };
  return { text: "Available", color: "text-green-500" };
}

// ============================================
// FIGHTER ROW (expandable)
// ============================================

function RosterFighterRow({ fighter }: { fighter: Fighter }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const status = statusLabel(fighter);

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-neutral-500 w-6 shrink-0">
            {fighter.isChampion ? (
              <Crown className="w-4 h-4 text-yellow-500" />
            ) : fighter.ranking != null ? (
              `#${fighter.ranking + 1}`
            ) : (
              "—"
            )}
          </span>
          <MomentumIcon momentum={fighter.momentum} />
          <div className="text-left min-w-0">
            <div className="font-medium text-sm truncate">
              {fighter.countryFlag} {fighter.name}
              {fighter.nickname && (
                <span className="text-neutral-500 font-normal">
                  {" "}
                  "{fighter.nickname}"
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500">
              {fighter.wins}-{fighter.losses}-{fighter.draws}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-[10px] ${status.color}`}>{status.text}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-black space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "STR", value: fighter.striking },
              { label: "GRP", value: fighter.grappling },
              { label: "CDO", value: fighter.cardio },
              { label: "CHIN", value: fighter.chin },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xs text-neutral-500">{stat.label}</div>
                <div className="text-sm font-semibold">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Fan Heat</span>
            <span>{fighter.fanHeat}/100</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500"
              style={{ width: `${fighter.fanHeat}%` }}
            />
          </div>

          {fighter.recentFights.length > 0 && (
            <div>
              <div className="text-xs text-neutral-500 mb-1.5">
                Recent Fights
              </div>
              <div className="space-y-1">
                {fighter.recentFights.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className={
                        f.result === "win" ? "text-green-500" : "text-red-500"
                      }
                    >
                      {f.result === "win" ? "W" : "L"} vs {f.opponentName}
                    </span>
                    <span className="text-neutral-600">{f.method}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => router.push(`/fighter/${fighter.id}`)}
            className="w-full py-2 rounded-lg bg-neutral-800 text-xs font-medium"
          >
            View Full Profile
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN ROSTER SCREEN
// ============================================

export default function RosterScreen() {
  const router = useRouter();
  const roster = useGameStore((s) => s.roster);
  const [activeClass, setActiveClass] = useState<WeightClass | null>(null);

  const weightClasses = useMemo(() => {
    const set = new Set(roster.map((f) => f.weightClass));
    return Array.from(set);
  }, [roster]);

  const currentClass = activeClass ?? weightClasses[0] ?? null;

  const fightersInClass = useMemo(() => {
    if (!currentClass) return [];
    return roster
      .filter((f) => f.weightClass === currentClass)
      .sort((a, b) => {
        if (a.isChampion) return -1;
        if (b.isChampion) return 1;
        return (a.ranking ?? 999) - (b.ranking ?? 999);
      });
  }, [roster, currentClass]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Rankings</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {roster.length} fighters across {weightClasses.length} divisions
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => router.push("/scouting")}
            className="text-xs text-neutral-400 border border-neutral-700 rounded-full px-3 py-1.5"
          >
            Scout
          </button>
          <button
            onClick={() => router.push("/teams")}
            className="text-xs text-neutral-400 border border-neutral-700 rounded-full px-3 py-1.5"
          >
            Teams
          </button>
          <button
            onClick={() => router.push("/records")}
            className="text-xs text-neutral-400 border border-neutral-700 rounded-full px-3 py-1.5"
          >
            Records
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {weightClasses.map((wc) => (
          <button
            key={wc}
            onClick={() => setActiveClass(wc)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
              currentClass === wc
                ? "bg-white text-black border-white"
                : "border-neutral-700 text-neutral-400"
            }`}
          >
            {wc}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {fightersInClass.map((fighter) => (
          <RosterFighterRow key={fighter.id} fighter={fighter} />
        ))}
      </div>
    </div>
  );
}
