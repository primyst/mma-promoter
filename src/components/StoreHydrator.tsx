"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";

/**
 * Silently loads the saved game on mount if the in-memory store is empty
 * but a save exists in localStorage. This covers page refreshes and direct
 * navigation — previously the save only loaded when the user tapped
 * "Continue" on the start screen, so refreshing anywhere else made it look
 * like the roster/feed had vanished even though localStorage still had it.
 */
export default function StoreHydrator() {
  const loadFromSave = useGameStore((s) => s.loadFromSave);

  useEffect(() => {
    const currentRoster = useGameStore.getState().roster;
    if (currentRoster.length === 0) {
      loadFromSave();
    }
  }, [loadFromSave]);

  return null;
}
