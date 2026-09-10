"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Trash2, Plus, LogOut, Settings2, ShieldCheck,
  Video as VideoIcon, Play, RefreshCw, Eye, EyeOff, FolderOpen
} from "lucide-react";
import { Video, AppSettings, CategoryItem } from "@/types";
import { getStorageService } from "@/lib/storage";
import { fetchYouTubeMetadata, extractYouTubeId } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { ParentGate } from "@/components/ParentGate";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"videos" | "categories" | "settings" | "stats">("videos");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data
  const [videos, setVideos] = useState<Video[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  
  // Video Add Form
  const [urlInput, setUrlInput] = useState("");
  const [fetchedMeta, setFetchedMeta] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  // Category Add Form
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🎨");
  
  // Load data
  const loadData = useCallback(async () => {
    try {
      const storage = await getStorageService();
      const [vids, cfg, cats] = await Promise.all([
        storage.getVideos(),
        storage.getSettings(),
        storage.getCategories(),
      ]);
      setVideos(vids);
      setSettings(cfg);
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0].name);
    } catch (err) {
      console.error(err);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  // Video Actions
  const handleFetchMetadata = async () => {
    const yid = extractYouTubeId(urlInput);
    if (!yid) return alert("رابط يوتيوب غير صالح");
    setIsFetching(true);
    try {
      const meta = await fetchYouTubeMetadata(yid);
      setFetchedMeta({ ...meta, id: yid });
    } catch (e) {
      alert("فشل جلب بيانات الفيديو");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddVideo = async () => {
    if (!fetchedMeta || !selectedCategory) return;
    try {
      const storage = await getStorageService();
      await storage.addVideo({
        youtubeId: fetchedMeta.id,
        title: fetchedMeta.title,
        thumbnail: fetchedMeta.thumbnail, // Fix: use .thumbnail instead of .thumbnail_url
        category: selectedCategory,
        tags: [],
        enabled: true,
      });
      setUrlInput("");
      setFetchedMeta(null);
      loadData();
    } catch (err) {
      alert("حدث خطأ أثناء إضافة الفيديو.");
    }
  };

  const toggleVideoVisibility = async (v: Video) => {
    const storage = await getStorageService();
    await storage.updateVideo(v.id, { enabled: !v.enabled });
    loadData();
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    const storage = await getStorageService();
    await storage.deleteVideo(id);
    loadData();
  };

  // Category Actions
  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      const storage = await getStorageService();
      await storage.addCategory({
        name: newCatName,
        emoji: newCatEmoji,
        colorFrom: "violet-500", // default random colors could be implemented
        colorTo: "purple-500",
      });
      setNewCatName("");
      loadData();
    } catch (err) {
      alert("فشل إضافة القائمة");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("حذف هذه القائمة؟")) return;
    const storage = await getStorageService();
    await storage.deleteCategory(id);
    loadData();
  };

  if (!isAuthenticated) {
    return (
      <ParentGate
        isOpen={true}
        onClose={() => {}}
        onVerified={() => setIsAuthenticated(true)}
        storedPin={settings?.pin || "1234"}
        title="لوحة تحكم الوالدين 🛡️"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold font-cairo text-violet-400">لوحة الوالدين</h1>
            <p className="text-white/50 text-sm">بصمة أمان</p>
          </div>
          <button
            onClick={() => window.location.href = "/feed"}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
          >
            رجوع للطفل <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 overflow-x-auto">
          <TabButton active={activeTab === "videos"} onClick={() => setActiveTab("videos")} icon={<VideoIcon />} label="الفيديوهات" />
          <TabButton active={activeTab === "categories"} onClick={() => setActiveTab("categories")} icon={<FolderOpen />} label="القوائم" />
          <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings2 />} label="الإعدادات" />
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus /> إضافة قائمة جديدة</h2>
              <div className="flex gap-4">
                <input
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  placeholder="🎨"
                  className="w-16 bg-black/50 border border-white/20 rounded-xl p-3 text-center"
                />
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="اسم القائمة (مثال: علوم)"
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl p-3"
                />
                <button onClick={handleAddCategory} className="bg-violet-600 px-6 rounded-xl hover:bg-violet-500">إضافة</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="font-bold">{c.name}</span>
                  </div>
                  <button onClick={() => deleteCategory(c.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === "videos" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex gap-2">
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="الصق رابط يوتيوب هنا..."
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl p-3"
                  dir="ltr"
                />
                <button onClick={handleFetchMetadata} disabled={isFetching || !urlInput} className="bg-violet-600 px-6 rounded-xl">
                  {isFetching ? <RefreshCw className="w-5 h-5 animate-spin" /> : "بحث"}
                </button>
              </div>

              {fetchedMeta && (
                <div className="mt-6 p-4 bg-black/40 rounded-xl flex gap-4">
                  <img src={fetchedMeta.thumbnail} alt="thumb" className="w-32 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-bold line-clamp-1">{fetchedMeta.title}</h3>
                    <div className="flex gap-2 mt-3">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-white/10 rounded-lg p-2 text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>
                        ))}
                      </select>
                      <button onClick={handleAddVideo} className="bg-green-600 px-4 rounded-lg flex items-center gap-2">
                        <Plus className="w-4 h-4" /> إضافة
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {videos.map((v) => (
                <div key={v.id} className={cn("bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-4 transition", !v.enabled && "opacity-50 grayscale")}>
                  <img src={v.thumbnail} className="w-24 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm line-clamp-1">{v.title}</h4>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-md mt-2 inline-block">{v.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleVideoVisibility(v)} className="p-2 bg-white/10 rounded-lg">
                      {v.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteVideo(v.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Placeholder */}
        {activeTab === "settings" && (
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center text-white/50">
            الإعدادات تم اختصارها لتوفير المساحة.
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition", active ? "bg-violet-600 text-white" : "text-white/60 hover:bg-white/10")}>
      {icon} <span className="font-bold">{label}</span>
    </button>
  );
}
