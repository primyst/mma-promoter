"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";

export default function TeamsScreen() {
  const router = useRouter();
  const teams = useGameStore((s) => s.teams);
  const roster = useGameStore((s) => s.roster);

  const independentCount = roster.filter((f) => !f.teamId && !f.isRetired).length;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Teams & Camps</h1>
      </div>

      <div className="px-4 py-4 space-y-2">
        {teams.map((team) => {
          const members = roster.filter(
            (f) => f.teamId === team.id && !f.isRetired
          );
          const champCount = members.filter((f) => f.isChampion).length;

          return (
            <div
              key={team.id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-sm">{team.name}</h2>
                <span className="text-[10px] text-neutral-500">
                  Rep {team.reputation}/100
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-2">{team.headCoach}</p>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {members.length} fighters
                </span>
                {champCount > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <ShieldCheck className="w-3.5 h-3.5" /> {champCount} champion
                    {champCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {members.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {members.slice(0, 6).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => router.push(`/fighter/${m.id}`)}
                      className="text-[10px] bg-neutral-800 rounded-full px-2 py-1"
                    >
                      {m.name}
                    </button>
                  ))}
                  {members.length > 6 && (
                    <span className="text-[10px] text-neutral-600 px-2 py-1">
                      +{members.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Independent fighters */}
        <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-1">Independent</h2>
          <p className="text-xs text-neutral-500">
            {independentCount} fighter{independentCount !== 1 ? "s" : ""} training
            without a camp
          </p>
        </div>
      </div>
    </div>
  );
}
