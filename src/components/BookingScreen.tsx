"use client";

import { useState, useMemo } from "react";
import { useGameStore } from "@/lib/gameStore";
import { getBookableFighters, validateMatchup } from "@/lib/booking";
import { Fighter, BookedFight } from "@/types/game";
import {
  Flame,
  Snowflake,
  Minus,
  ShieldAlert,
  Crown,
  Swords,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

// ============================================
// MOMENTUM ICON HELPER
// ============================================

function MomentumIcon({ momentum }: { momentum: Fighter["momentum"] }) {
  if (momentum === "hot") return <Flame className="w-4 h-4 text-orange-500" />;
  if (momentum === "cold") return <Snowflake className="w-4 h-4 text-blue-400" />;
  return <Minus className="w-4 h-4 text-neutral-400" />;
}

// ============================================
// FIGHTER PICKER ROW
// ============================================

function FighterRow({
  fighter,
  selected,
  onSelect,
}: {
  fighter: Fighter;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
        selected
          ? "border-red-500 bg-red-500/10"
          : "border-neutral-800 bg-neutral-900 active:bg-neutral-800"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <MomentumIcon momentum={fighter.momentum} />
        <div className="text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">{fighter.name}</span>
            {fighter.isChampion && (
              <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            )}
          </div>
          <div className="text-xs text-neutral-500">
            {fighter.wins}-{fighter.losses}-{fighter.draws}
            {fighter.ranking != null ? ` · #${fighter.ranking}` : ""}
          </div>
        </div>
      </div>
      <div className="text-xs text-neutral-500 shrink-0 ml-2">
        {fighter.fanHeat}🔥
      </div>
    </button>
  );
}

// ============================================
// MAIN BOOKING SCREEN
// ============================================

export default function BookingScreen() {
  const roster = useGameStore((s) => s.roster);
  const draftCard = useGameStore((s) => s.draftCard);
  const addFightToDraft = useGameStore((s) => s.addFightToDraft);
  const removeFightFromDraft = useGameStore((s) => s.removeFightFromDraft);
  const submitCard = useGameStore((s) => s.submitCard);

  const [pickingFor, setPickingFor] = useState<"A" | "B" | null>(null);
  const [slotA, setSlotA] = useState<Fighter | null>(null);
  const [slotB, setSlotB] = useState<Fighter | null>(null);
  const [isTitleFight, setIsTitleFight] = useState(false);
  const [isMainEvent, setIsMainEvent] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | null>(null);

  const bookable = useMemo(() => getBookableFighters(roster), [roster]);

  const alreadyBookedIds = useMemo(() => {
    const ids = new Set<string>();
    draftCard.forEach((f) => {
      ids.add(f.fighterAId);
      ids.add(f.fighterBId);
    });
    return ids;
  }, [draftCard]);

  const availableForPicker = bookable.filter(
    (f) => !alreadyBookedIds.has(f.id) && f.id !== slotA?.id && f.id !== slotB?.id
  );

  const matchup = useMemo(() => {
    if (!slotA || !slotB) return null;
    return validateMatchup(slotA, slotB, isTitleFight);
  }, [slotA, slotB, isTitleFight]);

  function handlePick(fighter: Fighter) {
    if (pickingFor === "A") setSlotA(fighter);
    if (pickingFor === "B") setSlotB(fighter);
    setPickingFor(null);
  }

  function handleAddFight() {
    if (!slotA || !slotB || !matchup?.valid) return;

    const fight: BookedFight = {
      id: crypto.randomUUID(),
      fighterAId: slotA.id,
      fighterBId: slotB.id,
      isMainEvent,
      isTitleFight,
    };
    addFightToDraft(fight);
    setSlotA(null);
    setSlotB(null);
    setIsTitleFight(false);
    setIsMainEvent(false);
  }

  function handleSubmit() {
    const result = submitCard();
    if (!result.success) {
      setSubmitError(result.errors);
    } else {
      setSubmitError(null);
    }
  }

  const rosterMap = useMemo(
    () => new Map(roster.map((f) => [f.id, f])),
    [roster]
  );

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-neutral-800">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Swords className="w-5 h-5" />
          Book Fight Card
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {bookable.length} of {roster.length} fighters available this week
        </p>
      </div>

      {/* Fighter picker overlay */}
      {pickingFor && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
            <h2 className="font-medium">Select Fighter {pickingFor}</h2>
            <button onClick={() => setPickingFor(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {availableForPicker.length === 0 && (
              <p className="text-sm text-neutral-500 text-center mt-8">
                No eligible fighters left to book.
              </p>
            )}
            {availableForPicker.map((fighter) => (
              <FighterRow
                key={fighter.id}
                fighter={fighter}
                selected={false}
                onSelect={() => handlePick(fighter)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fight builder */}
      <div className="px-4 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPickingFor("A")}
            className="border border-dashed border-neutral-700 rounded-lg py-4 px-3 text-sm text-left"
          >
            {slotA ? (
              <span className="font-medium">{slotA.name}</span>
            ) : (
              <span className="text-neutral-500">+ Fighter A</span>
            )}
          </button>
          <button
            onClick={() => setPickingFor("B")}
            className="border border-dashed border-neutral-700 rounded-lg py-4 px-3 text-sm text-left"
          >
            {slotB ? (
              <span className="font-medium">{slotB.name}</span>
            ) : (
              <span className="text-neutral-500">+ Fighter B</span>
            )}
          </button>
        </div>

        {/* Toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsMainEvent(!isMainEvent)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
              isMainEvent
                ? "bg-white text-black border-white"
                : "border-neutral-700 text-neutral-400"
            }`}
          >
            Main Event
          </button>
          <button
            onClick={() => setIsTitleFight(!isTitleFight)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
              isTitleFight
                ? "bg-yellow-500 text-black border-yellow-500"
                : "border-neutral-700 text-neutral-400"
            }`}
          >
            Title Fight
          </button>
        </div>

        {/* Matchup feedback */}
        {matchup && matchup.blockers.length > 0 && (
          <div className="bg-red-950/50 border border-red-900 rounded-lg p-3 space-y-1">
            {matchup.blockers.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {b}
              </div>
            ))}
          </div>
        )}
        {matchup && matchup.valid && matchup.warnings.length > 0 && (
          <div className="bg-yellow-950/50 border border-yellow-900 rounded-lg p-3 space-y-1">
            {matchup.warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-yellow-500"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAddFight}
          disabled={!slotA || !slotB || !matchup?.valid}
          className="w-full py-3 rounded-lg bg-red-600 disabled:bg-neutral-800 disabled:text-neutral-600 font-medium text-sm"
        >
          Add Fight to Card
        </button>
      </div>

      {/* Draft card list */}
      {draftCard.length > 0 && (
        <div className="px-4 py-4 border-t border-neutral-800 space-y-2">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            This Week's Card
          </h2>
          {draftCard.map((fight) => {
            const a = rosterMap.get(fight.fighterAId);
            const b = rosterMap.get(fight.fighterBId);
            return (
              <div
                key={fight.id}
                className="flex items-center justify-between bg-neutral-900 rounded-lg px-4 py-3"
              >
                <div className="text-sm">
                  <span className="font-medium">{a?.name}</span>
                  <span className="text-neutral-500 mx-2">vs</span>
                  <span className="font-medium">{b?.name}</span>
                  <div className="flex gap-1.5 mt-1">
                    {fight.isMainEvent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black">
                        MAIN
                      </span>
                    )}
                    {fight.isTitleFight && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500 text-black">
                        TITLE
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => removeFightFromDraft(fight.id)}>
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {submitError && (
        <div className="mx-4 mb-3 bg-red-950/50 border border-red-900 rounded-lg p-3 space-y-1">
          {submitError.map((e, i) => (
            <div key={i} className="text-xs text-red-400">
              {e}
            </div>
          ))}
        </div>
      )}

      {/* Sticky submit bar */}
      {draftCard.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-neutral-800">
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg bg-white text-black font-medium text-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Lock In Card ({draftCard.length}{" "}
            {draftCard.length === 1 ? "fight" : "fights"})
          </button>
        </div>
      )}
    </div>
  );
}
