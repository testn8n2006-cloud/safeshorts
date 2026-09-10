import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format seconds into MM:SS */
export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Format seconds into Arabic-friendly remaining time string */
export function formatTimeArabic(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  if (mins <= 0) return "أقل من دقيقة";
  if (mins === 1) return "دقيقة واحدة";
  if (mins === 2) return "دقيقتان";
  if (mins <= 10) return `${mins} دقائق`;
  return `${mins} دقيقة`;
}

/** Get today's date as YYYY-MM-DD string */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/** Generate a simple UUID v4-like string */
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Category colors for pills */
// Removed hardcoded categories as they are now dynamic
