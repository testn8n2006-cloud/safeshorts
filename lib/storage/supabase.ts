// ============================================================
// Supabase Storage Service Stub
// ============================================================
// Activated via: NEXT_PUBLIC_STORAGE_PROVIDER=supabase in .env.local
//
// Required env vars:
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
//
// Required Supabase tables:
//
// CREATE TABLE videos (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   youtube_id TEXT NOT NULL,
//   title TEXT NOT NULL,
//   thumbnail TEXT NOT NULL,
//   category TEXT NOT NULL,
//   tags TEXT[] DEFAULT '{}',
//   enabled BOOLEAN DEFAULT true,
//   added_at TIMESTAMPTZ DEFAULT now(),
//   watch_count INTEGER DEFAULT 0
// );
//
// CREATE TABLE settings (
//   id TEXT PRIMARY KEY DEFAULT 'singleton',
//   pin TEXT DEFAULT '1234',
//   daily_limit_minutes INTEGER DEFAULT 30,
//   watched_today_seconds INTEGER DEFAULT 0,
//   last_watch_date TEXT DEFAULT CURRENT_DATE::TEXT,
//   active_categories TEXT[] DEFAULT '{}'
// );
// ============================================================

import { StorageService, Video, AppSettings, Category, CategoryItem } from "@/types";
import { generateId, getTodayString } from "@/lib/utils";

// Dynamic import to avoid build errors when supabase is not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSupabase(): Promise<any> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    return createClient(supabaseUrl, supabaseKey);
  } catch {
    throw new Error(
      "Supabase not installed. Run: npm install @supabase/supabase-js"
    );
  }
}

export class SupabaseStorageService implements StorageService {
  async getVideos(): Promise<Video[]> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("videos")
      .select("*")
      .order("added_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async addVideo(
    video: Omit<Video, "id" | "addedAt" | "watchCount">
  ): Promise<Video> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("videos")
      .insert({
        youtube_id: video.youtubeId,
        title: video.title,
        thumbnail: video.thumbnail,
        category: video.category,
        tags: video.tags,
        enabled: video.enabled,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase Insert Error:", JSON.stringify(error, null, 2));
      throw error;
    }
    return mapRow(data);
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
    const sb = await getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.thumbnail !== undefined) dbUpdates.thumbnail = updates.thumbnail;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
    if (updates.watchCount !== undefined)
      dbUpdates.watch_count = updates.watchCount;

    const { data, error } = await sb
      .from("videos")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Supabase Update Error:", JSON.stringify(error, null, 2));
      throw error;
    }
    return mapRow(data);
  }

  async deleteVideo(id: string): Promise<void> {
    const sb = await getSupabase();
    const { error } = await sb.from("videos").delete().eq("id", id);
    if (error) {
      console.error("Supabase Delete Error:", JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async incrementWatchCount(id: string): Promise<void> {
    const sb = await getSupabase();
    const { error } = await sb.rpc("increment_watch_count", { video_id: id });
    if (error) {
      // Fallback: manual increment
      const { data } = await sb
        .from("videos")
        .select("watch_count")
        .eq("id", id)
        .single();
      if (data) {
        await sb
          .from("videos")
          .update({ watch_count: data.watch_count + 1 })
          .eq("id", id);
      }
    }
  }

  async getSettings(): Promise<AppSettings> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("settings")
      .select("*")
      .eq("id", "singleton")
      .single();

    if (error || !data) {
      // Upsert defaults
      const defaults: AppSettings = {
        pin: "1234",
        dailyLimitMinutes: 30,
        watchedTodaySeconds: 0,
        lastWatchDate: getTodayString(),
        activeCategories: ["الكل", "كرتون", "قصص", "أناشيد"] as Category[],
      };
      await sb.from("settings").upsert({ id: "singleton", ...mapSettingsToDb(defaults) });
      return defaults;
    }

    const settings = mapSettingsRow(data);

    // Reset daily counter if it's a new day
    const today = getTodayString();
    if (settings.lastWatchDate !== today) {
      const updated = {
        ...settings,
        watchedTodaySeconds: 0,
        lastWatchDate: today,
      };
      await sb
        .from("settings")
        .update(mapSettingsToDb(updated))
        .eq("id", "singleton");
      return updated;
    }

    return settings;
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    const sb = await getSupabase();
    await sb
      .from("settings")
      .update(mapSettingsToDb(updated))
      .eq("id", "singleton");
    return updated;
  }
  async getCategories(): Promise<CategoryItem[]> {
    const sb = await getSupabase();
    const { data, error } = await sb.from("categories").select("*");
    if (error) {
      console.error("Supabase Get Categories Error:", JSON.stringify(error, null, 2));
      throw error;
    }
    return (data || []).map(mapCategoryRow);
  }

  async addCategory(category: Omit<CategoryItem, "id">): Promise<CategoryItem> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("categories")
      .insert({
        name: category.name,
        emoji: category.emoji,
        color_from: category.colorFrom,
        color_to: category.colorTo,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase Add Category Error:", JSON.stringify(error, null, 2));
      throw error;
    }
    return mapCategoryRow(data);
  }

  async deleteCategory(id: string): Promise<void> {
    const sb = await getSupabase();
    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) {
      console.error("Supabase Delete Category Error:", JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

// ── Row mappers ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategoryRow(row: any): CategoryItem {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    colorFrom: row.color_from,
    colorTo: row.color_to,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Video {
  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    thumbnail: row.thumbnail,
    category: row.category as Category,
    tags: row.tags || [],
    enabled: row.enabled,
    addedAt: row.added_at,
    watchCount: row.watch_count || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSettingsRow(row: any): AppSettings {
  return {
    pin: row.pin || "1234",
    dailyLimitMinutes: row.daily_limit_minutes ?? 30,
    watchedTodaySeconds: row.watched_today_seconds ?? 0,
    lastWatchDate: row.last_watch_date || getTodayString(),
    activeCategories: row.active_categories || [],
  };
}

function mapSettingsToDb(s: AppSettings): Record<string, unknown> {
  return {
    pin: s.pin,
    daily_limit_minutes: s.dailyLimitMinutes,
    watched_today_seconds: s.watchedTodaySeconds,
    last_watch_date: s.lastWatchDate,
    active_categories: s.activeCategories,
  };
}

// Suppress unused import warning when supabase pkg is not installed
void generateId;
