"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { searchHeroes } from "@/lib/hero-search";
import { TYPE_STYLE } from "@/lib/constants";
import type { HeroType } from "@/types";

interface HeroOption {
  id: string;
  name: string;
  type: HeroType | null;
}

interface Props {
  selected: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  placeholder?: string;
}

export function HeroPicker({
  selected,
  onAdd,
  onRemove,
  placeholder = "영웅 이름 검색 (예: 브브, 여포...)",
}: Props) {
  const [heroes, setHeroes] = useState<HeroOption[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient()
      .from("heroes")
      .select("id, name, type")
      .order("name")
      .then(({ data }) => setHeroes((data as HeroOption[]) ?? []));
  }, []);

  const available = heroes.filter((h) => !selected.includes(h.name));
  const results = query.trim() ? searchHeroes(available, query) : available.slice(0, 8);

  function handleSelect(name: string) {
    onAdd(name);
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-2">
      {/* 선택된 영웅 태그 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium"
            >
              {name}
              <button
                type="button"
                onClick={() => onRemove(name)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 검색 입력 + 드롭다운 */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pl-8"
        />

        {open && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
            {results.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-3">
                {query ? "검색 결과 없음" : "영웅 도감에 등록된 영웅이 없습니다"}
              </p>
            ) : (
              results.map((hero) => {
                const style = hero.type ? TYPE_STYLE[hero.type] : null;
                return (
                  <button
                    key={hero.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // blur 전에 click이 먼저 동작하도록
                    onClick={() => handleSelect(hero.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                  >
                    <span>{hero.name}</span>
                    {style && (
                      <span className={`rounded px-1.5 py-0.5 text-xs ${style.className}`}>
                        {style.label}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
