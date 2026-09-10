"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getStorageService } from "@/lib/storage";
import { getTodayString, formatTime } from "@/lib/utils";

// ============================================================
// useScreenTime — Daily screen-time tracker & lock mechanism
// ============================================================

export interface ScreenTimeState {
  /** Whether viewing is currently locked due to quota expiry */
  isLocked: boolean;
  /** Total seconds watched today */
  watchedSeconds: number;
  /** Daily limit in seconds (0 = unlimited) */
  limitSeconds: number;
  /** Seconds remaining (null = unlimited) */
  remainingSeconds: number | null;
  /** Formatted "MM:SS" time watched today */
  formattedWatched: string;
  /** Formatted "MM:SS" time remaining (or "∞") */
  formattedRemaining: string;
  /** Progress percentage 0–100 */
  progress: number;
  /** Call this while a video is actively playing (every second) */
  tick: () => void;
  /** Unlock from the parent portal (PIN verified) */
  unlock: () => Promise<void>;
  /** Reset watch stats (admin action) */
  resetStats: () => Promise<void>;
}

export function useScreenTime(): ScreenTimeState {
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [limitSeconds, setLimitSeconds] = useState(30 * 60); // 30 min default
  const [isLocked, setIsLocked] = useState(false);
  const storageRef = useRef<Awaited<ReturnType<typeof getStorageService>> | null>(null);
  const lastSaveRef = useRef<number>(Date.now());

  // Load persisted state on mount
  useEffect(() => {
    async function init() {
      const storage = await getStorageService();
      storageRef.current = storage;
      const settings = await storage.getSettings();

      // Reset if new day
      const today = getTodayString();
      const watched =
        settings.lastWatchDate === today ? settings.watchedTodaySeconds : 0;

      setWatchedSeconds(watched);
      setLimitSeconds(
        settings.dailyLimitMinutes === 0 ? 0 : settings.dailyLimitMinutes * 60
      );

      if (
        settings.dailyLimitMinutes > 0 &&
        watched >= settings.dailyLimitMinutes * 60
      ) {
        setIsLocked(true);
      }
    }
    init();
  }, []);

  // Tick called every second while a video plays
  const tick = useCallback(() => {
    setWatchedSeconds((prev) => {
      const next = prev + 1;

      // Auto-lock if limit reached
      if (limitSeconds > 0 && next >= limitSeconds) {
        setIsLocked(true);
      }

      // Throttle saves: persist every 10 seconds to avoid thrashing
      const now = Date.now();
      if (now - lastSaveRef.current >= 10_000) {
        lastSaveRef.current = now;
        storageRef.current?.updateSettings({
          watchedTodaySeconds: next,
          lastWatchDate: getTodayString(),
        });
      }

      return next;
    });
  }, [limitSeconds]);

  // Unlock called after PIN verification
  const unlock = useCallback(async () => {
    setIsLocked(false);
    // Give 5 bonus minutes of extra watch time
    const storage = storageRef.current;
    if (storage) {
      const settings = await storage.getSettings();
      const newLimit = settings.dailyLimitMinutes + 5;
      await storage.updateSettings({ dailyLimitMinutes: newLimit });
      setLimitSeconds(newLimit * 60);
    }
  }, []);

  // Reset stats
  const resetStats = useCallback(async () => {
    const storage = storageRef.current;
    if (!storage) return;
    await storage.updateSettings({
      watchedTodaySeconds: 0,
      lastWatchDate: getTodayString(),
    });
    setWatchedSeconds(0);
    setIsLocked(false);
  }, []);

  // Derived values
  const remainingSeconds =
    limitSeconds > 0 ? Math.max(0, limitSeconds - watchedSeconds) : null;

  const progress =
    limitSeconds > 0
      ? Math.min(100, (watchedSeconds / limitSeconds) * 100)
      : 0;

  const formattedWatched = formatTime(watchedSeconds);
  const formattedRemaining =
    remainingSeconds !== null ? formatTime(remainingSeconds) : "∞";

  return {
    isLocked,
    watchedSeconds,
    limitSeconds,
    remainingSeconds,
    formattedWatched,
    formattedRemaining,
    progress,
    tick,
    unlock,
    resetStats,
  };
}
