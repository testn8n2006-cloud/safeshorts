import { StorageService, Video, AppSettings } from "@/types";

// ============================================================
// Abstract Storage Service Interface
// ============================================================
// Usage:
//   import { getStorageService } from "@/lib/storage";
//   const storage = getStorageService();
//   const videos = await storage.getVideos();
//
// To switch to Supabase: set NEXT_PUBLIC_STORAGE_PROVIDER=supabase
// in your .env.local file.
// ============================================================

let _instance: StorageService | null = null;

export async function getStorageService(): Promise<StorageService> {
  if (_instance) return _instance;

  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "localStorage";

  if (provider === "supabase") {
    const { SupabaseStorageService } = await import("./supabase");
    _instance = new SupabaseStorageService();
  } else {
    const { LocalStorageService } = await import("./localStorage");
    _instance = new LocalStorageService();
  }

  return _instance;
}

// Re-export types for convenience
export type { StorageService, Video, AppSettings };
