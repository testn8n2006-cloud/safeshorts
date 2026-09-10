"use client";

import { useCallback, useRef } from "react";
import { TapCoordinates } from "@/types";

// ============================================================
// useDoubleTap — Scroll-aware tap gesture detector
// ============================================================
// Distinguishes taps from swipes:
//   vertical/horizontal movement > 15px → it's a scroll, ignore
//   small movement → single tap or double tap
// ============================================================

const SCROLL_THRESHOLD = 15; // px

interface UseDoubleTapOptions {
  onSingleTap?: (coords: TapCoordinates) => void;
  onDoubleTap?: (coords: TapCoordinates) => void;
  delay?: number;
}

export function useDoubleTap({
  onSingleTap,
  onDoubleTap,
  delay = 250,
}: UseDoubleTapOptions) {
  const lastTapRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Track where touch started
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!e.changedTouches.length) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      // If user swiped (scroll gesture) → don't intercept
      if (touchStartRef.current) {
        const deltaY = Math.abs(endY - touchStartRef.current.y);
        const deltaX = Math.abs(endX - touchStartRef.current.x);
        if (deltaY > SCROLL_THRESHOLD || deltaX > SCROLL_THRESHOLD) {
          touchStartRef.current = null;
          return; // Let the scroll container handle it
        }
      }
      touchStartRef.current = null;
      e.stopPropagation();

      const x = endX;
      const y = endY;
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        lastTapRef.current = 0;
        onDoubleTap?.({ x, y });
      } else {
        lastTapRef.current = now;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onSingleTap?.({ x, y });
          timerRef.current = null;
        }, delay);
      }
    },
    [onSingleTap, onDoubleTap, delay]
  );

  // Desktop mouse click fallback
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const x = e.clientX;
      const y = e.clientY;
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        lastTapRef.current = 0;
        onDoubleTap?.({ x, y });
      } else {
        lastTapRef.current = now;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { onSingleTap?.({ x, y }); timerRef.current = null; }, delay);
      }
    },
    [onSingleTap, onDoubleTap, delay]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onClick: handleClick,
  };
}
