"use client";

import { CategoryItem } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  active: string;
  onChange: (c: string) => void;
  categories: CategoryItem[];
}

export function CategoryFilter({
  active,
  onChange,
  categories,
}: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 px-1 min-w-max pb-2">
        <button
          onClick={() => onChange("الكل")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition-all text-sm font-cairo font-bold",
            active === "الكل"
              ? "bg-gradient-to-r from-violet-500 to-purple-500 border-transparent text-white shadow-lg shadow-purple-500/20"
              : "bg-black/40 border-white/10 text-white/70 hover:bg-black/60 backdrop-blur-md"
          )}
        >
          <span>🌟</span>
          <span>الكل</span>
        </button>

        {categories.map((cat) => {
          const isActive = active === cat.name;
          const bgGradient = `from-${cat.colorFrom} to-${cat.colorTo}`;
          
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.name)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full border transition-all text-sm font-cairo font-bold",
                isActive
                  ? `bg-gradient-to-r ${bgGradient} border-transparent text-white shadow-lg`
                  : "bg-black/40 border-white/10 text-white/70 hover:bg-black/60 backdrop-blur-md"
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
