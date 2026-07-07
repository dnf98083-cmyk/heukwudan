"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Hero, HeroType } from "@/types";

const TYPE_STYLE: Record<HeroType, { label: string; className: string }> = {
  공격형: { label: "공격형", className: "bg-red-500/20 text-red-400" },
  마법형: { label: "마법형", className: "bg-blue-500/20 text-blue-400" },
  지원형: { label: "지원형", className: "bg-yellow-500/20 text-yellow-400" },
  만능형: { label: "만능형", className: "bg-purple-500/20 text-purple-400" },
  방어형: { label: "방어형", className: "bg-amber-800/30 text-amber-700" },
};

const TYPES = Object.keys(TYPE_STYLE) as HeroType[];

export default function HeroesPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<HeroType | "전체">("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("heroes")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setHeroes(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = heroes.filter((h) => {
    const matchQuery = !query || h.name.includes(query);
    const matchType = typeFilter === "전체" || h.type === typeFilter;
    return matchQuery && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={22} />
            영웅 도감
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            등록된 영웅 목록 — 방어팀 공략 검색에 사용됩니다.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          영웅 추가
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="영웅 이름 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 타입 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("전체")}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium border transition-colors",
            typeFilter === "전체"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-accent/30"
          )}
        >
          전체 ({heroes.length})
        </button>
        {TYPES.map((type) => {
          const { label, className } = TYPE_STYLE[type];
          const count = heroes.filter((h) => h.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                typeFilter === type
                  ? `${className} ring-1 ring-current`
                  : `${className} opacity-50 hover:opacity-100`
              )}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">
          {heroes.length === 0 ? "등록된 영웅이 없습니다." : "검색 결과가 없습니다."}
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((hero) => {
            const typeStyle = hero.type ? TYPE_STYLE[hero.type] : null;
            return (
              <Card key={hero.id} className="hover:bg-accent/20 transition-colors">
                <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{hero.name}</p>
                    {hero.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{hero.description}</p>
                    )}
                  </div>
                  {typeStyle ? (
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${typeStyle.className}`}>
                      {typeStyle.label}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded px-2 py-0.5 text-xs text-muted-foreground border border-border/60">
                      미분류
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length}명 표시
        {filtered.length !== heroes.length && ` (전체 ${heroes.length}명)`}
      </p>
    </div>
  );
}
