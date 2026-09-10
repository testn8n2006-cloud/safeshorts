"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ============================================================
// useYouTubePlayer — Wraps the YouTube IFrame API
// ============================================================
// Loads the YT IFrame API script once globally, then creates
// and manages a player instance tied to a specific iframe div.
// ============================================================

declare global {
  interface Window {
    YT: {
      Player: new (
        element: string | HTMLElement,
        options: YTPlayerOptions
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoading?: boolean;
    _ytApiReady?: boolean;
    _ytApiCallbacks?: Array<() => void>;
  }
}

interface YTPlayerOptions {
  videoId?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number }) => void;
  };
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getPlayerState(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getDuration(): number;
  getCurrentTime(): number;
  destroy(): void;
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
}

// ── Load the API once ────────────────────────────────────────
function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window._ytApiReady) return Promise.resolve();

  return new Promise((resolve) => {
    if (!window._ytApiCallbacks) window._ytApiCallbacks = [];
    window._ytApiCallbacks.push(resolve);

    if (!window._ytApiLoading) {
      window._ytApiLoading = true;

      const existingReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        window._ytApiReady = true;
        existingReady?.();
        window._ytApiCallbacks?.forEach((cb) => cb());
        window._ytApiCallbacks = [];
      };

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

interface UseYouTubePlayerOptions {
  videoId: string;
  containerId: string;
  isActive: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function useYouTubePlayer({
  videoId,
  containerId,
  isActive,
  onPlay,
  onPause,
  onEnd,
  onTimeUpdate,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YTPlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize player
  useEffect(() => {
    let destroyed = false;

    async function init() {
      await loadYTApi();
      if (destroyed) return;

      const container = document.getElementById(containerId);
      if (!container) return;

      const player = new window.YT.Player(container, {
        videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
          autoplay: 0,
          mute: 0, // 🔥 ALWAYS start unmuted!
          loop: 0,
          cc_load_policy: 0,
          showinfo: 0,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: ({ target }) => {
            if (destroyed) return;
            playerRef.current = target;
            target.unMute(); // Ensure it's unmuted
            setIsReady(true);
          },
          onStateChange: ({ data }) => {
            if (destroyed) return;
            const states = window.YT?.PlayerState;
            if (data === states?.PLAYING) {
              setIsPlaying(true);
              onPlay?.();
            } else if (data === states?.PAUSED) {
              setIsPlaying(false);
              onPause?.();
            } else if (data === states?.ENDED) {
              setIsPlaying(false);
              onEnd?.();
            }
          },
        },
      });
    }

    init();

    return () => {
      destroyed = true;
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, videoId]);

  // Track time progress
  useEffect(() => {
    if (!isReady || !isPlaying || !onTimeUpdate) return;

    timeUpdateIntervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (player) {
        const current = player.getCurrentTime?.() || 0;
        const duration = player.getDuration?.() || 0;
        if (duration > 0) onTimeUpdate(current, duration);
      }
    }, 1000);

    return () => {
      if (timeUpdateIntervalRef.current)
        clearInterval(timeUpdateIntervalRef.current);
    };
  }, [isReady, isPlaying, onTimeUpdate]);

  // React to active state changes
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    if (isActive) {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isActive, isReady]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const togglePlay = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    const state = playerRef.current.getPlayerState();
    const states = window.YT?.PlayerState;
    if (state === states?.PLAYING) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    }
  }, [isReady]);

  return { isReady, isPlaying, play, pause, togglePlay };
}
