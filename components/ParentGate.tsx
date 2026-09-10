"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Delete, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// ParentGate — PIN verification modal
// Default PIN: 1234
// Optional: Math challenge mode
// ============================================================

interface ParentGateProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  storedPin: string;
  title?: string;
}

const NUMPAD = [
  ["١", "٢", "٣"],
  ["٤", "٥", "٦"],
  ["٧", "٨", "٩"],
  ["⌫", "٠", "✓"],
];

// Eastern Arabic numerals to Western
const ARABIC_TO_WESTERN: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

// Generate a random math challenge
function generateMathChallenge(): { question: string; answer: string } {
  const operations = ["+", "-", "×"] as const;
  const op = operations[Math.floor(Math.random() * 3)];
  let a: number, b: number, answer: number;

  if (op === "+") {
    a = Math.floor(Math.random() * 20) + 5;
    b = Math.floor(Math.random() * 20) + 5;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 20) + 15;
    b = Math.floor(Math.random() * 10) + 5;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a * b;
  }

  return {
    question: `حل المسألة: ${a} ${op} ${b} = ؟`,
    answer: String(answer),
  };
}

type ChallengeMode = "pin" | "math";

export function ParentGate({
  isOpen,
  onClose,
  onVerified,
  storedPin,
  title = "بوابة الوالدين 🔐",
}: ParentGateProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<ChallengeMode>("pin");
  const [mathChallenge, setMathChallenge] = useState(generateMathChallenge);
  const [shakeKey, setShakeKey] = useState(0);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setInput("");
      setError(false);
      setMathChallenge(generateMathChallenge());
    }
  }, [isOpen]);

  const verify = useCallback(() => {
    const expectedAnswer =
      mode === "pin" ? storedPin : mathChallenge.answer;

    if (input === expectedAnswer) {
      setError(false);
      onVerified();
      setTimeout(() => setInput(""), 300);
    } else {
      setError(true);
      setShakeKey((k) => k + 1);
      setTimeout(() => {
        setError(false);
        setInput("");
        if (mode === "math") setMathChallenge(generateMathChallenge());
      }, 1000);
    }
  }, [input, mode, storedPin, mathChallenge.answer, onVerified]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === "⌫") {
        setInput((p) => p.slice(0, -1));
      } else if (key === "✓") {
        verify();
      } else {
        const digit = ARABIC_TO_WESTERN[key] ?? key;
        if (mode === "pin" && input.length >= 4) return;
        setInput((p) => p + digit);
      }
    },
    [verify, input, mode]
  );

  // Auto-verify when 4 digits entered (PIN mode)
  useEffect(() => {
    if (mode === "pin" && input.length === 4) {
      verify();
    }
  }, [input, mode, verify]);

  const displayInput =
    mode === "pin"
      ? "●".repeat(input.length) + "○".repeat(Math.max(0, 4 - input.length))
      : input || "...";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-white/10"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-violet-400" />
                <h2 className="font-cairo font-bold text-white text-lg">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-5">
              {(["pin", "math"] as ChallengeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setInput("");
                    setError(false);
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-cairo transition-all",
                    mode === m
                      ? "bg-violet-600 text-white"
                      : "bg-white/10 text-white/60"
                  )}
                >
                  {m === "pin" ? "🔢 رمز PIN" : "🧮 تحدي رياضي"}
                </button>
              ))}
            </div>

            {/* Challenge prompt */}
            <p className="font-cairo text-white/70 text-sm text-center mb-4">
              {mode === "pin"
                ? "أدخل رمز الوالدين المكون من 4 أرقام"
                : mathChallenge.question}
            </p>

            {/* Input Display */}
            <motion.div
              key={shakeKey}
              animate={error ? { x: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={cn(
                "w-full py-4 rounded-2xl mb-5 text-center",
                "font-mono text-3xl tracking-widest font-bold",
                error
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : "bg-white/10 text-white border border-white/20"
              )}
            >
              {error ? (
                <span className="flex items-center justify-center gap-2 text-base font-cairo">
                  <AlertTriangle className="w-4 h-4" />
                  {mode === "pin" ? "رمز خاطئ!" : "إجابة خاطئة!"}
                </span>
              ) : (
                displayInput
              )}
            </motion.div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {NUMPAD.flat().map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleKey(key)}
                  className={cn(
                    "h-14 rounded-2xl font-bold text-xl transition-all",
                    "font-cairo select-none",
                    key === "✓"
                      ? "bg-violet-600 hover:bg-violet-500 text-white"
                      : key === "⌫"
                        ? "bg-white/10 hover:bg-white/20 text-white/70"
                        : "bg-white/15 hover:bg-white/25 text-white active:bg-white/30"
                  )}
                >
                  {key === "⌫" ? <Delete className="w-5 h-5 mx-auto" /> : key}
                </motion.button>
              ))}
            </div>

            <p className="font-cairo text-white/30 text-xs text-center mt-4">
              الرمز الافتراضي: 1234
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
