import { OEmbedResponse } from "@/types";

// ============================================================
// YouTube URL Parser
// Supports:
//  - https://youtube.com/shorts/{id}
//  - https://www.youtube.com/watch?v={id}
//  - https://youtu.be/{id}
//  - https://www.youtube.com/embed/{id}
//  - https://m.youtube.com/watch?v={id}
// ============================================================

const YT_ID_REGEX =
  /(?:youtube\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/**
 * Extract the 11-character YouTube video ID from any YouTube URL.
 * Returns null if the URL is not a recognizable YouTube URL.
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.trim().match(YT_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Build a safe YouTube embed URL with all child-safety parameters.
 */
export function buildEmbedUrl(videoId: string, origin: string): string {
  const params = new URLSearchParams({
    controls: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    fs: "0",
    disablekb: "1",
    iv_load_policy: "3",
    origin,
    autoplay: "0",
    mute: "1",
    loop: "0",
    cc_load_policy: "0",
    showinfo: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Fetch video metadata using the free YouTube oEmbed API.
 * No API key required.
 * Returns title and thumbnail URL.
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<{
  title: string;
  thumbnail: string;
}> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) {
      throw new Error(`oEmbed fetch failed: ${response.status}`);
    }
    const data: OEmbedResponse = await response.json();
    return {
      title: data.title,
      // oEmbed returns a lower-res thumbnail; we prefer maxresdefault
      thumbnail:
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` ||
        data.thumbnail_url,
    };
  } catch {
    // Fallback to hqdefault if maxresdefault unavailable
    return {
      title: "فيديو يوتيوب",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

/**
 * Get the best available thumbnail for a YouTube video ID.
 * Tries maxresdefault → hqdefault → mqdefault in order.
 */
export function getThumbnailUrl(
  videoId: string,
  quality: "maxresdefault" | "hqdefault" | "mqdefault" = "hqdefault"
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
