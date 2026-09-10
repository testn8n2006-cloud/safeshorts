import { StorageService, Video, AppSettings, Category, CategoryItem } from "@/types";
import { generateId, getTodayString } from "@/lib/utils";

// ============================================================
// LocalStorage Implementation + Pre-seeded Mock Data
// ============================================================

const VIDEOS_KEY = "safeshorts_videos";
const SETTINGS_KEY = "safeshorts_settings";

// ── Pre-seeded mock videos (real popular kids' content on YouTube) ──
const MOCK_VIDEOS: Video[] = [
  {
    id: "mock-1",
    youtubeId: "4lKcGFsiJCg",
    title: "أغنية الحروف العربية للأطفال 🌟",
    thumbnail: "https://img.youtube.com/vi/4lKcGFsiJCg/hqdefault.jpg",
    category: "أناشيد",
    tags: ["حروف", "أبجدية", "تعليم"],
    enabled: true,
    addedAt: new Date().toISOString(),
    watchCount: 12,
  },
  {
    id: "mock-2",
    youtubeId: "CMLJMeFh4HY",
    title: "تجربة علمية رائعة للأطفال 🔬",
    thumbnail: "https://img.youtube.com/vi/CMLJMeFh4HY/hqdefault.jpg",
    category: "تجارب علمية",
    tags: ["علوم", "تجارب", "ممتع"],
    enabled: true,
    addedAt: new Date().toISOString(),
    watchCount: 8,
  },
  {
    id: "mock-3",
    youtubeId: "ZpJpPRhFMGw",
    title: "قصة الأرنب والسلحفاة 📖",
    thumbnail: "https://img.youtube.com/vi/ZpJpPRhFMGw/hqdefault.jpg",
    category: "قصص",
    tags: ["قصص", "أخلاق", "مرح"],
    enabled: true,
    addedAt: new Date().toISOString(),
    watchCount: 20,
  },
  {
    id: "mock-4",
    youtubeId: "9bZkp7q19f0",
    title: "نشيد الأرقام العربية 🔢",
    thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg",
    category: "أناشيد",
    tags: ["أرقام", "تعليم", "أناشيد"],
    enabled: true,
    addedAt: new Date().toISOString(),
    watchCount: 15,
  },
  {
    id: "mock-5",
    youtubeId: "OPf0YbXqDm0",
    title: "كرتون مضحك للأطفال 🎨",
    thumbnail: "https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    category: "كرتون",
    tags: ["كرتون", "مضحك", "مرح"],
    enabled: true,
    addedAt: new Date().toISOString(),
    watchCount: 30,
  },
  {
    id: "mock-6",
    youtubeId: "dQw4w9WgXcQ",
    title: "تعليم الألوان بالعربي 🌈",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    category: "تعليمي",
    tags: ["ألوان", "تعليم", "أطفال"],
    enabled: true,
    addedAt: new Date().toISOString(),
    watchCount: 5,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  pin: "1234",
  dailyLimitMinutes: 30,
  watchedTodaySeconds: 0,
  lastWatchDate: getTodayString(),
  activeCategories: [
    "الكل",
    "كرتون",
    "قصص",
    "أناشيد",
    "تجارب علمية",
    "رياضة",
    "طبيعة",
    "تعليمي",
  ] as Category[],
};

// ── Helpers ──────────────────────────────────────────────────
function isClient(): boolean {
  return typeof window !== "undefined";
}

function readVideos(): Video[] {
  if (!isClient()) return MOCK_VIDEOS;
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    if (!raw) return MOCK_VIDEOS;
    return JSON.parse(raw) as Video[];
  } catch {
    return MOCK_VIDEOS;
  }
}

function writeVideos(videos: Video[]): void {
  if (!isClient()) return;
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

function readSettings(): AppSettings {
  if (!isClient()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: AppSettings): void {
  if (!isClient()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Service Implementation ────────────────────────────────────
export class LocalStorageService implements StorageService {
  /** Ensure mock data is seeded on first load */
  private ensureSeed(): void {
    if (!isClient()) return;
    if (!localStorage.getItem(VIDEOS_KEY)) {
      writeVideos(MOCK_VIDEOS);
    }
    if (!localStorage.getItem(SETTINGS_KEY)) {
      writeSettings(DEFAULT_SETTINGS);
    }
  }

  async getVideos(): Promise<Video[]> {
    this.ensureSeed();
    return readVideos();
  }

  async addVideo(
    video: Omit<Video, "id" | "addedAt" | "watchCount">
  ): Promise<Video> {
    const videos = readVideos();
    const newVideo: Video = {
      ...video,
      id: generateId(),
      addedAt: new Date().toISOString(),
      watchCount: 0,
    };
    videos.push(newVideo);
    writeVideos(videos);
    return newVideo;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
    const videos = readVideos();
    const idx = videos.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error(`Video ${id} not found`);
    videos[idx] = { ...videos[idx], ...updates };
    writeVideos(videos);
    return videos[idx];
  }

  async deleteVideo(id: string): Promise<void> {
    const videos = readVideos().filter((v) => v.id !== id);
    writeVideos(videos);
  }

  async incrementWatchCount(id: string): Promise<void> {
    const videos = readVideos();
    const idx = videos.findIndex((v) => v.id === id);
    if (idx !== -1) {
      videos[idx].watchCount += 1;
      writeVideos(videos);
    }
  }

  async getSettings(): Promise<AppSettings> {
    this.ensureSeed();
    const settings = readSettings();
    // Reset daily counter if it's a new day
    const today = getTodayString();
    if (settings.lastWatchDate !== today) {
      const updated = {
        ...settings,
        watchedTodaySeconds: 0,
        lastWatchDate: today,
      };
      writeSettings(updated);
      return updated;
    }
    return settings;
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = readSettings();
    const updated = { ...current, ...updates };
    writeSettings(updated);
    return updated;
  }

  // ── Categories ──────────────────────────────────────────────────
  async getCategories(): Promise<CategoryItem[]> {
    const cats = this.load<CategoryItem[]>("categories");
    if (!cats || cats.length === 0) {
      const defaults: CategoryItem[] = [
        { id: generateId(), name: "كرتون", emoji: "🎨", colorFrom: "pink-500", colorTo: "rose-500" },
        { id: generateId(), name: "قصص", emoji: "📖", colorFrom: "amber-500", colorTo: "orange-500" },
      ];
      this.save("categories", defaults);
      return defaults;
    }
    return cats;
  }

  async addCategory(category: Omit<CategoryItem, "id">): Promise<CategoryItem> {
    const cats = await this.getCategories();
    const newCat = { ...category, id: generateId() };
    this.save("categories", [...cats, newCat]);
    return newCat;
  }

  async deleteCategory(id: string): Promise<void> {
    const cats = await this.getCategories();
    this.save("categories", cats.filter((c) => c.id !== id));
  }
}
