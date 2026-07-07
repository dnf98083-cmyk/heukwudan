"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Hero, HeroType } from "@/types";

export const TYPE_STYLE: Record<HeroType, { label: string; className: string; dot: string }> = {
  공격형: { label: "공격형", className: "bg-red-500/20 text-red-400",    dot: "bg-red-400" },
  마법형: { label: "마법형", className: "bg-blue-500/20 text-blue-400",   dot: "bg-blue-400" },
  지원형: { label: "지원형", className: "bg-yellow-500/20 text-yellow-400", dot: "bg-yellow-400" },
  만능형: { label: "만능형", className: "bg-purple-500/20 text-purple-400", dot: "bg-purple-400" },
  방어형: { label: "방어형", className: "bg-amber-800/30 text-amber-700",  dot: "bg-amber-700" },
};

const TYPES = Object.keys(TYPE_STYLE) as HeroType[];

export default function HeroesPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<HeroType | "전체">("전체");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Hero | null>(null);

  async function fetchHeroes() {
    const { data } = await createClient().from("heroes").select("*").order("name");
    setHeroes(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchHeroes(); }, []);

  const filtered = heroes.filter((h) => {
    const matchQuery = !query || h.name.includes(query);
    const matchType = typeFilter === "전체" || h.type === typeFilter;
    return matchQuery && matchType;
  });

  // 타입별 카운트
  const counts = heroes.reduce<Record<string, number>>(
    (acc, h) => { acc[h.type ?? "미분류"] = (acc[h.type ?? "미분류"] ?? 0) + 1; return acc; },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={22} />
            영웅 도감
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            카드를 클릭하면 타입을 분류할 수 있습니다.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
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
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            typeFilter === "전체"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-accent/30"
          )}
        >
          전체 ({heroes.length})
        </button>
        {TYPES.map((type) => {
          const { label, className } = TYPE_STYLE[type];
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                typeFilter === type
                  ? `${className} border-current`
                  : `${className} opacity-60 border-transparent hover:opacity-100`
              )}
            >
              {label} ({counts[type] ?? 0})
            </button>
          );
        })}
        {(counts["미분류"] ?? 0) > 0 && (
          <button
            onClick={() => setTypeFilter("전체")}
            className="rounded-full px-3 py-1 text-xs font-medium border border-border text-muted-foreground opacity-60 hover:opacity-100 transition-colors"
          >
            미분류 ({counts["미분류"]})
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">
          {heroes.length === 0 ? "등록된 영웅이 없습니다." : "검색 결과가 없습니다."}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((hero) => {
            const typeStyle = hero.type ? TYPE_STYLE[hero.type] : null;
            return (
              <button
                key={hero.id}
                onClick={() => setEditTarget(hero)}
                className="text-left group"
              >
                <Card className="hover:bg-accent/20 transition-colors cursor-pointer">
                  <CardContent className="pt-3.5 pb-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {typeStyle ? (
                        <span className={`shrink-0 w-2 h-2 rounded-full ${typeStyle.dot}`} />
                      ) : (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-border" />
                      )}
                      <p className="font-semibold truncate">{hero.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {typeStyle ? (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeStyle.className}`}>
                          {typeStyle.label}
                        </span>
                      ) : (
                        <span className="rounded px-2 py-0.5 text-xs text-muted-foreground border border-border/60">
                          미분류
                        </span>
                      )}
                      <Pencil size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length}명 표시{filtered.length !== heroes.length && ` / 전체 ${heroes.length}명`}
      </p>

      {/* 영웅 추가 다이얼로그 */}
      <AddHeroDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); fetchHeroes(); }}
      />

      {/* 영웅 타입 편집 다이얼로그 */}
      {editTarget && (
        <EditHeroDialog
          hero={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchHeroes(); }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// 영웅 추가
// ────────────────────────────────────────────────
function AddHeroDialog({
  open, onClose, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<HeroType | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() { setName(""); setType(""); setError(""); }

  async function handleSave() {
    if (!name.trim()) { setError("영웅 이름을 입력하세요."); return; }
    setSaving(true);
    const { error: err } = await createClient()
      .from("heroes")
      .insert({ name: name.trim(), type: type || null });
    setSaving(false);
    if (err) {
      setError(err.code === "23505" ? "이미 존재하는 영웅 이름입니다." : err.message);
      return;
    }
    reset();
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-xs">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">영웅 추가</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">영웅 이름 *</label>
            <Input
              placeholder="예: 손오공"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">타입</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TYPES.map((t) => {
                const { label, className } = TYPE_STYLE[t];
                return (
                  <button
                    key={t}
                    onClick={() => setType(type === t ? "" : t)}
                    className={cn(
                      "rounded-lg py-2 text-xs font-medium border transition-colors",
                      type === t
                        ? `${className} border-current`
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>취소</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────
// 영웅 타입 편집
// ────────────────────────────────────────────────
function EditHeroDialog({
  hero, onClose, onSaved,
}: {
  hero: Hero;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<HeroType | "">(hero.type ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await createClient()
      .from("heroes")
      .update({ type: type || null })
      .eq("id", hero.id);
    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!confirm(`"${hero.name}"을 삭제할까요?`)) return;
    await createClient().from("heroes").delete().eq("id", hero.id);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xs">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">{hero.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">타입을 선택하세요</p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* 미분류 선택 (타입 제거) */}
            <button
              onClick={() => setType("")}
              className={cn(
                "rounded-lg py-2 text-xs font-medium border transition-colors",
                type === ""
                  ? "bg-muted text-foreground border-foreground/30"
                  : "border-border text-muted-foreground hover:bg-accent/30"
              )}
            >
              미분류
            </button>
            {TYPES.map((t) => {
              const { label, className } = TYPE_STYLE[t];
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-lg py-2 text-xs font-medium border transition-colors",
                    type === t
                      ? `${className} border-current`
                      : "border-border text-muted-foreground hover:bg-accent/30"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
              onClick={handleDelete}
            >
              삭제
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
