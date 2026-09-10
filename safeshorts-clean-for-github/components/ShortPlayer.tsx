"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDoubleTap } from "@/hooks/useDoubleTap";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { Video, TapCoordinates } from "@/types";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

// ============================================================
// ShortPlayer — Single video slide
// The transparent overlay is the KEY child-safety mechanism.
// touch-action: pan-y → lets vertical swipes scroll naturally,
// while taps are intercepted for play/pause & hearts.
// ============================================================

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const HEART_EMOJIS = ["❤️", "✨", "⭐", "💛", "🌟", "💖", "🎉", "🌈", "🦋", "🌸"];

interface ShortPlayerProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  onWatchTick: () => void;
}

export function ShortPlayer({
  video,
  isActive,
  isMuted,
  onWatchTick,
}: ShortPlayerProps) {
  const containerId = `yt-player-${video.id}`;
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<"play" | "pause" | null>(null);
  const [progress, setProgress] = useState(0);
  const heartIdRef = useRef(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleTimeUpdate = useCallback(
    (current: number, duration: number) => {
      setProgress((current / duration) * 100);
    },
    []
  );

  const { isReady, isPlaying, togglePlay } = useYouTubePlayer({
    videoId: video.youtubeId,
    containerId,
    isMuted,
    isActive,
    onTimeUpdate: handleTimeUpdate,
  });

  // Screen-time tick — every second while playing
  useEffect(() => {
    if (isPlaying && isActive) {
      tickIntervalRef.current = setInterval(() => {
        onWatchTick();
      }, 1000);
    } else {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    }
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isPlaying, isActive, onWatchTick]);

  const flashIcon = useCallback((type: "play" | "pause") => {
    setShowPlayPauseIcon(type);
    setTimeout(() => setShowPlayPauseIcon(null), 700);
  }, []);

  const handleSingleTap = useCallback(
    (_coords: TapCoordinates) => {
      togglePlay();
      flashIcon(isPlaying ? "pause" : "play");
    },
    [togglePlay, isPlaying, flashIcon]
  );

  const handleDoubleTap = useCallback(({ x, y }: TapCoordinates) => {
    const count = 6 + Math.floor(Math.random() * 3);
    const newHearts: HeartParticle[] = Array.from({ length: count }, (_, i) => ({
      id: heartIdRef.current + i,
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 40,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
    }));
    heartIdRef.current += count;
    setHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts((prev) =>
        prev.filter((h) => !newHearts.find((nh) => nh.id === h.id))
      );
    }, 1400);
  }, []);

  const tapHandlers = useDoubleTap({
    onSingleTap: handleSingleTap,
    onDoubleTap: handleDoubleTap,
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* ── YouTube IFrame Container ───────────────────────── */}
      <div
        id={containerId}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── Loading / Thumbnail Skeleton ──────────────────── */}
      {!isReady && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundImage: `url(${video.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </motion.div>
            </div>
            <p className="text-white/80 text-sm font-cairo tracking-wide">جاري التحميل…</p>
          </div>
        </div>
      )}

      {/* ── TRANSPARENT GESTURE OVERLAY ────────────────────── */}
      {/* touch-action: pan-y  →  vertical swipes scroll the feed naturally */}
      {/* Taps (no movement) are caught for play/pause & hearts              */}
      <div
        {...tapHandlers}
        className="absolute inset-0 z-20 select-none"
        style={{
          touchAction: "pan-y",           // ← KEY: allows native vertical scroll
          WebkitTapHighlightColor: "transparent",
          cursor: "pointer",
        }}
        aria-label="منطقة التحكم في الفيديو"
      />

      {/* ── Play/Pause Flash Icon ─────────────────────────── */}
      <AnimatePresence>
        {showPlayPauseIcon && (
          <motion.div
            key={showPlayPauseIcon}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="w-24 h-24 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center shadow-2xl">
              {showPlayPauseIcon === "play" ? (
                <Play className="w-12 h-12 text-white fill-white ml-1" />
              ) : (
                <Pause className="w-12 h-12 text-white fill-white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Heart Particle Burst ──────────────────────────── */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.span
            key={heart.id}
            initial={{
              position: "absolute",
              left: heart.x,
              top: heart.y,
              scale: 0.3,
              opacity: 1,
              x: 0,
              y: 0,
            }}
            animate={{
              scale: [0.3, 1.6, 1.2],
              opacity: [1, 1, 0],
              x: (Math.random() - 0.5) * 80,
              y: -100 - Math.random() * 80,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute z-30 text-4xl pointer-events-none"
            style={{ left: heart.x, top: heart.y }}
          >
            {heart.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* ── Bottom Gradient + Controls ───────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-25 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }}
      >
        <div className="p-4 pb-8">
          {/* Video title */}
          <p className="text-white font-cairo font-bold text-base line-clamp-2 mb-2 text-right drop-shadow-lg leading-snug">
            {video.title}
          </p>

          {/* Category badge */}
          <div className="flex justify-end mb-3">
            <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-cairo border border-white/10">
              {video.category}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-400 to-pink-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
