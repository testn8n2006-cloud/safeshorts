"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Video, Category } from "@/types";
import { ShortPlayer } from "./ShortPlayer";
import { cn } from "@/lib/utils";

// ============================================================
// KidFeed — Vertical Snap Feed with IntersectionObserver
// ============================================================
// Native CSS scroll-snap for buttery smooth swipe on mobile.
// IntersectionObserver (threshold 0.6) detects active slide.
// Active video plays; all others pause+mute immediately.
// ============================================================

interface KidFeedProps {
  videos: Video[];
  activeCategory: string;
  onWatchTick: () => void;
  isLocked: boolean;
}

export function KidFeed({
  videos,
  activeCategory,
  onWatchTick,
  isLocked,
}: KidFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Filter by category
  const filteredVideos =
    activeCategory === "الكل"
      ? videos.filter((v) => v.enabled)
      : videos.filter((v) => v.enabled && v.category === activeCategory);

  // Set first video active on mount / category change
  useEffect(() => {
    if (filteredVideos.length > 0) {
      setActiveVideoId(filteredVideos[0].id);
      // Scroll back to top when category changes
      containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // IntersectionObserver — detect which slide is centered
  useEffect(() => {
    if (filteredVideos.length === 0) return;

    const root = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const videoId = entry.target.getAttribute("data-video-id");
            if (videoId) setActiveVideoId(videoId);
          }
        }
      },
      { root, threshold: 0.6 }
    );

    slideRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredVideos]);

  const setSlideRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) {
        slideRefs.current.set(id, el);
        el.setAttribute("data-video-id", id);
      } else {
        slideRefs.current.delete(id);
      }
    },
    []
  );

  if (filteredVideos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-violet-900 to-purple-950 text-white text-center p-8">
        <div className="text-7xl mb-5">📭</div>
        <h2 className="font-cairo text-2xl font-bold mb-2">لا توجد فيديوهات</h2>
        <p className="font-cairo text-sm text-white/60 leading-relaxed">
          اطلب من وليّ أمرك إضافة فيديوهات
          <br />من لوحة الإدارة 🔐
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full scrollbar-hide",
        isLocked && "overflow-hidden pointer-events-none"
      )}
      style={{
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch", // iOS momentum scroll
        overscrollBehavior: "contain",    // prevent page bounce
      }}
    >
      {filteredVideos.map((video) => (
        <div
          key={video.id}
          ref={setSlideRef(video.id)}
          className="w-full flex-shrink-0 flex items-center justify-center bg-black"
          style={{
            height: "100dvh",
            scrollSnapAlign: "start",
            scrollSnapStop: "always",      // don't skip slides on fast swipe
          }}
        >
          {/* Constrain to 9:16 portrait — centered on wide screens */}
          <div
            className="relative h-full"
            style={{ width: "min(calc(100dvh * 9 / 16), 100vw)" }}
          >
            <ShortPlayer
              video={video}
              isActive={activeVideoId === video.id && !isLocked}
              onWatchTick={onWatchTick}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
