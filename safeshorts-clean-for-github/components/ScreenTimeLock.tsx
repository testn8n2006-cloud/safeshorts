"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Star } from "lucide-react";

// ============================================================
// ScreenTimeLock — Friendly "Bedtime" overlay
// Shown when daily screen-time quota expires.
// ============================================================

interface ScreenTimeLockProps {
  isVisible: boolean;
  formattedWatched: string;
  onRequestUnlock: () => void;
}

export function ScreenTimeLock({
  isVisible,
  formattedWatched,
  onRequestUnlock,
}: ScreenTimeLockProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, #1e1b4b 0%, #0f0a1e 100%)",
          }}
          dir="rtl"
        >
          {/* Floating Stars */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-300"
              style={{
                left: `${Math.random() * 90 + 5}%`,
                top: `${Math.random() * 70 + 5}%`,
                fontSize: `${Math.random() * 16 + 8}px`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              ✦
            </motion.div>
          ))}

          {/* Moon Illustration */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6"
          >
            <div className="relative">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 shadow-2xl shadow-amber-500/50 flex items-center justify-center">
                <Moon className="w-20 h-20 text-amber-800 fill-amber-800/30" />
              </div>
              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-yellow-300/20 blur-2xl scale-150 -z-10" />
            </div>
          </motion.div>

          {/* Stars icons */}
          <div className="flex gap-2 mb-5">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                transition={{ delay: i * 0.3, duration: 1.5, repeat: Infinity }}
              >
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </motion.div>
            ))}
          </div>

          {/* Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center px-8 mb-8"
          >
            <h1 className="font-cairo font-black text-3xl text-white mb-3 leading-tight">
              وقت النوم! 🌙
            </h1>
            <p className="font-cairo text-white/80 text-lg leading-relaxed mb-2">
              أحسنت! لقد شاهدت اليوم
              <br />
              <span className="text-yellow-300 font-bold text-xl">
                {formattedWatched}
              </span>
            </p>
            <p className="font-cairo text-white/60 text-base leading-relaxed">
              حان وقت اللعب في العالم الحقيقي!
              <br />
              🏃 🎨 📚 🌳
            </p>
          </motion.div>

          {/* Divider */}
          <div className="w-48 h-px bg-white/20 mb-6" />

          {/* Parent unlock button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onRequestUnlock}
            className="font-cairo text-white/50 text-sm py-3 px-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all"
          >
            🔐 وليّ الأمر — فتح إضافي
          </motion.button>

          <p className="font-cairo text-white/30 text-xs mt-4">
            سيُطلب منك رمز الوالدين
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
