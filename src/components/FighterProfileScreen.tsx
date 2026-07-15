"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { getAdjacentDivisions } from "@/lib/weightClassMove";
import { computeExpectedPurse } from "@/lib/contracts";
import { getFightingStyle } from "@/lib/fightingStyle";
import {
  Crown,
  Flame,
  Snowflake,
  Minus,
  ArrowLeft,
  Trophy,
  ArrowUpCircle,
  ArrowDownCircle,
  Users,
} from "lucide-react";

// ============================================
// HELPERS
// ============================================

function MomentumIcon({ momentum }: { momentum: string }) {
  if (momentum === "hot") return <Flame className="w-4 h-4 text-orange-500" />;
  if (momentum === "cold") return <Snowflake className="w-4 h-4 text-blue-400" />;
  return <Minus className="w-4 h-4 text-neutral-400" />;
}

// ============================================
// MAIN PROFILE SCREEN
// ============================================

export default function FighterProfileScreen({
  fighterId,
}: {
  fighterId: string;
}) {
  const router = useRouter();
  const roster = useGameStore((s) => s.roster);
  const teams = useGameStore((s) => s.teams);
  const titleHistory = useGameStore((s) => s.titleHistory);
  const promotion = useGameStore((s) => s.promotion);
  const moveFighterWeightClass = useGameStore((s) => s.moveFighterWeightClass);
  const offerContract = useGameStore((s) => s.offerContract);

  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveMessage, setMoveMessage] = useState<string | null>(null);
  const [contractOffer, setContractOffer] = useState<number | null>(null);
  const [contractFights, setContractFights] = useState(4);
  const [contractResult, setContractResult] = useState<string | null>(null);

  const fighter = useMemo(
    () => roster.find((f) => f.id === fighterId),
    [roster, fighterId]
  );

  const reigns = useMemo(
    () => titleHistory.filter((r) => r.championId === fighterId),
    [titleHistory, fighterId]
  );

  const adjacent = useMemo(
    () => (fighter ? getAdjacentDivisions(fighter.weightClass) : { up: null, down: null }),
    [fighter]
  );

  function handleMove(direction: "up" | "down") {
    const target = direction === "up" ? adjacent.up : adjacent.down;
    if (!target) return;

    const result = moveFighterWeightClass(fighterId, direction, target);
    if (!result.success) {
      setMoveError(result.error ?? "Couldn't move weight class");
      setMoveMessage(null);
    } else {
      setMoveError(null);
      setMoveMessage(`Moved to ${target}. Settling in before next fight.`);
    }
  }

  function handleOfferContract() {
    if (contractOffer == null) return;
    const result = offerContract(fighterId, contractFights, contractOffer);
    setContractResult(result.message);
    if (result.outcome === "countered" && result.counterPurse) {
      setContractOffer(result.counterPurse);
    }
  }

  if (!fighter) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Fighter not found.</p>
      </div>
    );
  }

  const totalDefenses = reigns.reduce((sum, r) => sum + r.defenses, 0);
  const currentReign = reigns.find((r) => r.endWeek === null);
  const team = teams.find((t) => t.id === fighter.teamId);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            {fighter.name}
            {fighter.isChampion && (
              <Crown className="w-4 h-4 text-yellow-500" />
            )}
          </h1>
          {fighter.nickname && (
            <p className="text-xs text-neutral-500">"{fighter.nickname}"</p>
          )}
          <p className="text-xs text-neutral-600 flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3" />
            {team ? team.name : "Independent"}
          </p>
        </div>
      </div>

      {/* Record + status */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">
            {fighter.wins}-{fighter.losses}-{fighter.draws}
          </p>
          <p className="text-xs text-neutral-500">
            {fighter.weightClass} · Age {fighter.age}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {fighter.countryFlag} {fighter.hometown} · {getFightingStyle(fighter)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MomentumIcon momentum={fighter.momentum} />
          <span className="text-xs text-neutral-400 capitalize">
            {fighter.momentum}
          </span>
        </div>
      </div>

      {/* Contract status */}
      <div className="px-4 mb-4">
        {fighter.contractFightsRemaining !== null ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {fighter.contractFightsRemaining} fight
              {fighter.contractFightsRemaining !== 1 ? "s" : ""} left on deal
            </span>
            <span className="text-xs text-neutral-500">
              ${fighter.purse.toLocaleString()}/fight
            </span>
          </div>
        ) : (
          <div className="bg-red-950/30 border border-red-900 rounded-lg p-3 space-y-3">
            <p className="text-xs text-red-400 font-medium">
              Free agent — not signed. Expected ask: $
              {computeExpectedPurse(fighter).toLocaleString()}/fight
            </p>

            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Purse offer"
                value={contractOffer ?? ""}
                onChange={(e) => setContractOffer(Number(e.target.value) || null)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <select
                value={contractFights}
                onChange={(e) => setContractFights(Number(e.target.value))}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white"
              >
                {[2, 3, 4, 5, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} fights
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOfferContract}
              disabled={!contractOffer}
              className="w-full py-2 rounded-lg bg-red-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-xs font-medium"
            >
              Offer Contract
            </button>

            {contractResult && (
              <p className="text-xs text-neutral-400">{contractResult}</p>
            )}
          </div>
        )}
      </div>

      {/* Weight class move */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleMove("down")}
            disabled={!adjacent.down}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-700 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            Move to {adjacent.down ?? "—"}
          </button>
          <button
            onClick={() => handleMove("up")}
            disabled={!adjacent.up}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-700 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            Move to {adjacent.up ?? "—"}
          </button>
        </div>
        {moveError && (
          <p className="text-xs text-red-400 mt-2">{moveError}</p>
        )}
        {moveMessage && (
          <p className="text-xs text-green-500 mt-2">{moveMessage}</p>
        )}
        {fighter.isChampion && (
          <p className="text-xs text-yellow-500 mt-2">
            Moving weight class will vacate the title.
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="px-4 grid grid-cols-4 gap-2 text-center mb-4">
        {[
          { label: "STR", value: fighter.striking },
          { label: "GRP", value: fighter.grappling },
          { label: "CDO", value: fighter.cardio },
          { label: "CHIN", value: fighter.chin },
        ].map((stat) => (
          <div key={stat.label} className="bg-neutral-900 rounded-lg py-2">
            <div className="text-[10px] text-neutral-500">{stat.label}</div>
            <div className="text-sm font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Fan heat */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span>Fan Heat</span>
          <span>{fighter.fanHeat}/100</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500"
            style={{ width: `${fighter.fanHeat}%` }}
          />
        </div>
      </div>

      {/* Title history */}
      {reigns.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Title History
          </h2>
          <div className="space-y-2">
            {reigns.map((reign, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${
                  reign.endWeek === null
                    ? "border-yellow-600 bg-yellow-950/20"
                    : "border-neutral-800 bg-neutral-900"
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{reign.weightClass} Champion</span>
                  {reign.endWeek === null && (
                    <span className="text-[10px] text-yellow-500 uppercase">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Week {reign.startWeek} –{" "}
                  {reign.endWeek ? `Week ${reign.endWeek}` : "Present"} ·{" "}
                  {reign.defenses} defense{reign.defenses !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career log */}
      <div className="px-4">
        <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
          Career Log
        </h2>
        {fighter.recentFights.length === 0 && (
          <p className="text-sm text-neutral-600">No fights recorded yet.</p>
        )}
        <div className="space-y-1.5">
          {fighter.recentFights.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-neutral-900 rounded-lg px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold text-xs ${
                    f.result === "win" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {f.result === "win" ? "W" : "L"}
                </span>
                <span>{f.opponentName}</span>
              </div>
              <div className="text-xs text-neutral-500">
                {f.method} · Wk {f.week}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
