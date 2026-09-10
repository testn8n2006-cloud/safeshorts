// ============================================================
// SafeShorts — Shared TypeScript Types
// ============================================================

export type Category = string;

export interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  colorFrom: string;
  colorTo: string;
}

export interface Video {
  id: string; // UUID (our internal ID)
  youtubeId: string; // 11-char YouTube video ID
  title: string;
  thumbnail: string;
  category: Category;
  tags: string[];
  enabled: boolean;
  addedAt: string; // ISO date string
  watchCount: number;
}

export interface AppSettings {
  pin: string; // 4-digit PIN, stored as string
  dailyLimitMinutes: number; // 0 = unlimited
  watchedTodaySeconds: number;
  lastWatchDate: string; // YYYY-MM-DD
  activeCategories: Category[];
}

export interface StorageService {
  // Videos
  getVideos(): Promise<Video[]>;
  addVideo(video: Omit<Video, "id" | "addedAt" | "watchCount">): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video>;
  deleteVideo(id: string): Promise<void>;
  incrementWatchCount(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(updates: Partial<AppSettings>): Promise<AppSettings>;

  // Categories
  getCategories(): Promise<CategoryItem[]>;
  addCategory(category: Omit<CategoryItem, "id">): Promise<CategoryItem>;
  deleteCategory(id: string): Promise<void>;
}

// YouTube oEmbed response shape
export interface OEmbedResponse {
  title: string;
  thumbnail_url: string;
  author_name: string;
  width: number;
  height: number;
}

// Gesture event payload
export interface TapCoordinates {
  x: number;
  y: number;
}
