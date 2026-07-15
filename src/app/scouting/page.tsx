"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { SCOUT_TIERS, ScoutTier } from "@/lib/scouting";
import { Fighter, WEIGHT_CLASS_ORDER, WeightClass } from "@/types/game";
import { ArrowLeft, Search, Sparkles, DollarSign } from "lucide-react";

export default function ScoutingScreen() {
  const router = useRouter();
  const promotion = useGameStore((s) => s.promotion);
  const scoutForTalent = useGameStore((s) => s.scoutForTalent);
  const signProspect = useGameStore((s) => s.signProspect);

  const [weightClass, setWeightClass] = useState<WeightClass>("Lightweight");
  const [tier, setTier] = useState<ScoutTier>("standard");
  const [candidates, setCandidates] = useState<Fighter[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedId, setSignedId] = useState<string | null>(null);

  function handleScout() {
    const result = scoutForTalent(weightClass, tier);
    if (!result.success) {
      setError(result.error ?? "Scouting failed");
      setCandidates(null);
      return;
    }
    setError(null);
    setCandidates(result.candidates ?? null);
    setSignedId(null);
  }

  function handleSign(candidate: Fighter) {
    signProspect(candidate);
    setSignedId(candidate.id);
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Scouting</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Weight class picker */}
        <div>
          <p className="text-xs text-neutral-500 mb-1.5">Division</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {WEIGHT_CLASS_ORDER.map((wc) => (
              <button
                key={wc}
                onClick={() => setWeightClass(wc)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border shrink-0 ${
                  weightClass === wc
                    ? "bg-white text-black border-white"
                    : "border-neutral-700 text-neutral-400"
                }`}
              >
                {wc}
              </button>
            ))}
          </div>
        </div>

        {/* Tier picker */}
        <div className="space-y-2">
          {(Object.keys(SCOUT_TIERS) as ScoutTier[]).map((t) => {
            const info = SCOUT_TIERS[t];
            return (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`w-full text-left rounded-lg p-3 border ${
                  tier === t
                    ? "border-red-600 bg-red-950/20"
                    : "border-neutral-800 bg-neutral-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{info.label}</span>
                  <span className="text-xs text-neutral-400">
                    ${info.cost.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {info.description}
                </p>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleScout}
          className="w-full py-3 rounded-lg bg-red-600 font-medium text-sm flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" /> Send Scouts
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Candidates */}
        {candidates && (
          <div className="space-y-2 pt-2">
            <h2 className="text-xs uppercase tracking-wide text-neutral-500">
              Candidates Found
            </h2>
            {candidates.map((candidate) => {
              const isBreakout = candidate.wins <= 2 && candidate.fanHeat >= 45;
              const isSigned = signedId === candidate.id;
              return (
                <div
                  key={candidate.id}
                  className={`rounded-lg p-4 border ${
                    isBreakout
                      ? "border-yellow-600 bg-yellow-950/20"
                      : "border-neutral-800 bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm flex items-center gap-1.5">
                      {candidate.name}
                      {isBreakout && (
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                      )}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {candidate.wins}-{candidate.losses}-{candidate.draws}
                    </span>
                  </div>
                  {isBreakout && (
                    <p className="text-[10px] text-yellow-500 mb-2">
                      Breakout prospect — elite raw tools, unproven record
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2 text-center mb-3">
                    {[
                      { label: "STR", value: candidate.striking },
                      { label: "GRP", value: candidate.grappling },
                      { label: "CDO", value: candidate.cardio },
                      { label: "CHIN", value: candidate.chin },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="text-[10px] text-neutral-500">
                          {stat.label}
                        </div>
                        <div className="text-xs font-semibold">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {candidate.purse.toLocaleString()}/fight
                    </span>
                    <span>{candidate.contractFightsRemaining}-fight deal</span>
                  </div>
                  <button
                    onClick={() => handleSign(candidate)}
                    disabled={isSigned}
                    className="w-full py-2 rounded-lg bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 text-xs font-medium"
                  >
                    {isSigned ? "Signed" : "Sign Fighter"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
