"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Timer, Settings2, ChevronUp, Palette } from "lucide-react";

import { KidFeed } from "@/components/KidFeed";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ScreenTimeLock } from "@/components/ScreenTimeLock";
import { ParentGate } from "@/components/ParentGate";
import { useScreenTime } from "@/hooks/useScreenTime";
import { getStorageService } from "@/lib/storage";
import { Video, Category, AppSettings } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// /feed — Kid's Reel Player Page
// ============================================================

// ── Themes ────────────────────────────────────────────────────
const THEMES = [
  { id: "dark",    label: "داكن",    bg: "from-slate-950 to-black",        accent: "violet" },
  { id: "purple",  label: "بنفسجي", bg: "from-violet-950 to-purple-950",  accent: "pink" },
  { id: "ocean",   label: "أزرق",   bg: "from-blue-950 to-cyan-950",      accent: "cyan" },
  { id: "forest",  label: "أخضر",   bg: "from-emerald-950 to-teal-950",   accent: "green" },
  { id: "sunset",  label: "غروب",   bg: "from-orange-950 to-rose-950",    accent: "orange" },
] as const;
type ThemeId = (typeof THEMES)[number]["id"];

const THEME_DOTS: Record<ThemeId, string> = {
  dark:   "bg-slate-400",
  purple: "bg-violet-400",
  ocean:  "bg-cyan-400",
  forest: "bg-emerald-400",
  sunset: "bg-orange-400",
};

export default function FeedPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("الكل");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeId>("purple");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const screenTime = useScreenTime();
  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[1];

  // Auto-unmute on first interaction
  useEffect(() => {
    const handleFirstTouch = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    };
    window.addEventListener("pointerdown", handleFirstTouch, { once: true });
    window.addEventListener("touchstart", handleFirstTouch, { once: true });
    window.addEventListener("click", handleFirstTouch, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
      window.removeEventListener("click", handleFirstTouch);
    };
  }, [hasInteracted]);

  // Load videos, settings & categories
  useEffect(() => {
    async function load() {
      const storage = await getStorageService();
      const [vids, cfg, cats] = await Promise.all([
        storage.getVideos(),
        storage.getSettings(),
        storage.getCategories(),
      ]);
      setVideos(vids);
      setSettings(cfg);
      setCategories(cats);
      setIsLoading(false);
    }
    load();

    // Restore saved theme
    const saved = localStorage.getItem("safeshorts_theme") as ThemeId | null;
    if (saved) setTheme(saved);
  }, []);

  const handleParentVerified = useCallback(() => {
    setShowParentGate(false);
    screenTime.unlock();
  }, [screenTime]);

  const handleThemeChange = useCallback((t: ThemeId) => {
    setTheme(t);
    localStorage.setItem("safeshorts_theme", t);
    setShowThemePicker(false);
  }, []);

  // ── Loading ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn("h-dvh bg-gradient-to-b", currentTheme.bg, "flex flex-col items-center justify-center gap-4")}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-4 border-violet-400 border-t-transparent"
        />
        <p className="font-cairo text-white/60 text-sm">جاري التحميل…</p>
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-dvh w-full overflow-hidden bg-gradient-to-b", currentTheme.bg)}
      dir="rtl"
    >
      {/* ── Main Feed ──────────────────────────────────────── */}
      <KidFeed
        videos={videos}
        activeCategory={activeCategory}
        onWatchTick={screenTime.tick}
        isLocked={screenTime.isLocked}
      />

      {/* ── Top Bar ────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-40 safe-top pointer-events-none">
        <div
          className="px-3 pt-3 pb-2"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
        >
          {/* Row 1: Logo | Timer + Controls */}
          <div className="flex items-center justify-between mb-2 pointer-events-auto">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-base shadow-lg">
                🛡️
              </div>
              <div className="leading-none">
                <span className="font-cairo font-black text-white text-sm drop-shadow">بصمة أمان</span>
                <p className="font-cairo text-white/40 text-[10px]">آمن • ومختار بعناية</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Screen-time pill */}
              <AnimatePresence>
                {screenTime.limitSeconds > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-cairo font-bold",
                      screenTime.progress > 80
                        ? "bg-red-500/80 text-white animate-pulse"
                        : screenTime.progress > 55
                          ? "bg-amber-500/80 text-white"
                          : "bg-white/15 backdrop-blur-sm text-white"
                    )}
                  >
                    <Timer className="w-3 h-3" />
                    <span>{screenTime.formattedRemaining}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Theme picker toggle */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setShowThemePicker((p) => !p)}
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10"
                aria-label="تغيير المظهر"
              >
                <Palette className="w-4 h-4 text-white" />
              </motion.button>

              {/* Parent lock */}
              <Link
                href="/admin"
                className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10"
                aria-label="لوحة الوالدين"
              >
                <Lock className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>

          {/* Row 2: Category pills */}
          <div className="pointer-events-auto">
            <CategoryFilter
              active={activeCategory}
              onChange={setActiveCategory}
              categories={categories}
            />
          </div>
        </div>
      </div>

      {/* ── Theme Picker Drawer ──────────────────────────────── */}
      <AnimatePresence>
        {showThemePicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-45"
              onClick={() => setShowThemePicker(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-xl rounded-t-3xl border-t border-white/10 p-5 pb-10"
              dir="rtl"
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-4" />

              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-violet-400" />
                <h3 className="font-cairo font-bold text-white text-base">اختر المظهر</h3>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {THEMES.map((t) => (
                  <motion.button
                    key={t.id}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleThemeChange(t.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 rounded-2xl border-2 transition-all",
                      theme === t.id
                        ? "border-white bg-white/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-full", THEME_DOTS[t.id])} />
                    <span className="font-cairo text-white text-xs">{t.label}</span>
                    {theme === t.id && (
                      <motion.div
                        layoutId="theme-check"
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setShowThemePicker(false)}
                className="w-full mt-5 py-3 rounded-2xl bg-white/10 text-white/60 font-cairo text-sm flex items-center justify-center gap-2"
              >
                <ChevronUp className="w-4 h-4" />
                إغلاق
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Screen Time Lock ────────────────────────────────── */}
      <ScreenTimeLock
        isVisible={screenTime.isLocked}
        formattedWatched={screenTime.formattedWatched}
        onRequestUnlock={() => setShowParentGate(true)}
      />

      {/* ── Parent Gate ─────────────────────────────────────── */}
      <ParentGate
        isOpen={showParentGate}
        onClose={() => setShowParentGate(false)}
        onVerified={handleParentVerified}
        storedPin={settings?.pin ?? "1234"}
        title="فتح وقت إضافي 🔓"
      />

      {/* ── First-visit swipe hint ───────────────────────────── */}
      <SwipeHint />

      {/* ── Settings quick-link (bottom corner) ─────────────── */}
      <motion.div
        className="absolute bottom-6 left-4 z-40 pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <Link
          href="/admin"
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
          aria-label="الإعدادات"
        >
          <Settings2 className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}

// ── Swipe hint (shown once per session) ───────────────────────
function SwipeHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("swipe_hint_seen");
    if (!seen) {
      const t1 = setTimeout(() => setVisible(true), 1500);
      const t2 = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem("swipe_hint_seen", "1");
      }, 4500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-2xl">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="text-3xl"
            >
              👆
            </motion.div>
            <p className="font-cairo text-white text-sm font-semibold">اسحب للأعلى للفيديو التالي</p>
            <p className="font-cairo text-white/50 text-xs">اضغط مرتين للقلب ❤️</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
