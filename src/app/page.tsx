"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { generateStarterRoster } from "@/lib/generateRoster";

export default function StartScreen() {
  const router = useRouter();
  const initNewGame = useGameStore((s) => s.initNewGame);
  const loadFromSave = useGameStore((s) => s.loadFromSave);

  function handleContinue() {
    if (loadFromSave()) {
      router.push("/dashboard");
    } else {
      alert("No save found — start a New Game.");
    }
  }

  function handleNewGame() {
    const { roster, teams } = generateStarterRoster();
    initNewGame("My Promotion", roster, teams);
    router.push("/dashboard");
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex flex-col items-center justify-end px-6 pb-16"
      style={{ backgroundImage: "url(/home.jpg)" }}
    >
      {/* Dark gradient overlay so buttons stay readable over any image */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={handleContinue}
          className="w-full py-3 bg-neutral-900/90 border border-neutral-700 text-white rounded-lg font-medium"
        >
          Continue
        </button>
        <button
          onClick={handleNewGame}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
