"use client";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { generateStarterRoster } from "@/lib/generateRoster";

export default function StartScreen() {
  const router = useRouter();
  const initNewGame = useGameStore((s) => s.initNewGame);
  const loadFromSave = useGameStore((s) => s.loadFromSave);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">MMA Promoter</h1>
      <button
        onClick={() => {
          if (loadFromSave()) router.push("/booking");
          else alert("No save found");
        }}
        className="w-full py-3 bg-neutral-800 rounded-lg"
      >
        Continue
      </button>
      <button
        onClick={() => {
          initNewGame("My Promotion", generateStarterRoster());
          router.push("/booking");
        }}
        className="w-full py-3 bg-red-600 rounded-lg"
      >
        New Game
      </button>
    </div>
  );
}