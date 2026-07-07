"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, RotateCcw, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TYPE_STYLE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { searchHeroes } from "@/lib/hero-search";
import type { Hero, HeroType } from "@/types";

const SPEED_BASE: Record<HeroType, number> = {
  방어형: 19, 지원형: 19, 만능형: 25, 마법형: 29, 공격형: 29,
};

interface Chip { name: string; type: HeroType | null }

const EMPTY_ORDER = Array<string>(6).fill("");

export default function SpeedCalcPage() {
  const [allHeroes, setAllHeroes] = useState<Hero[]>([]);
  const [speedResult, setSpeedResult] = useState<"승" | "패">("승");
  const [enemyChips, setEnemyChips] = useState<Chip[]>([]);
  const [allyChips, setAllyChips] = useState<Chip[]>([]);
  const [otherChips, setOtherChips] = useState<Chip[]>([]);
  const [showOtherSearch, setShowOtherSearch] = useState(false);
  const [battleOrder, setBattleOrder] = useState<string[]>([...EMPTY_ORDER]);
  const [analysis, setAnalysis] = useState<string | null>(null);

  // 검색 상태 (enemy/ally/other 섹션별)
  const [enemyQ, setEnemyQ] = useState("");
  const [allyQ, setAllyQ] = useState("");
  const [otherQ, setOtherQ] = useState("");
  const [activeSearch, setActiveSearch] = useState<"enemy" | "ally" | "other" | null>(null);

  const enemyRef = useRef<HTMLDivElement>(null);
  const allyRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().from("heroes").select("*").order("name").then(({ data }) => {
      setAllHeroes(data ?? []);
    });
  }, []);

  // 외부 클릭 시 검색 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const refs = [enemyRef, allyRef, otherRef];
      if (refs.every(r => !r.current?.contains(e.target as Node))) {
        setActiveSearch(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allChips = [...enemyChips, ...allyChips, ...otherChips];

  function addChip(hero: Hero, group: "enemy" | "ally" | "other") {
    const chip: Chip = { name: hero.name, type: hero.type as HeroType | null };
    const setter = group === "enemy" ? setEnemyChips : group === "ally" ? setAllyChips : setOtherChips;
    setter(prev => prev.find(c => c.name === hero.name) ? prev : [...prev, chip]);
    if (group === "enemy") setEnemyQ("");
    else if (group === "ally") setAllyQ("");
    else setOtherQ("");
    setActiveSearch(null);
    setAnalysis(null);
  }

  function removeChip(name: string) {
    setEnemyChips(p => p.filter(c => c.name !== name));
    setAllyChips(p => p.filter(c => c.name !== name));
    setOtherChips(p => p.filter(c => c.name !== name));
    setBattleOrder(p => p.map(s => s === name ? "" : s));
    setAnalysis(null);
  }

  function resetAll() {
    setBattleOrder([...EMPTY_ORDER]);
    setAnalysis(null);
  }

  function handleAnalyze() {
    const filled = battleOrder.filter(Boolean);
    if (filled.length === 0) { setAnalysis("전투 순서를 입력해주세요."); return; }

    const enemyNames = new Set(enemyChips.map(c => c.name));
    const allyNames = new Set(allyChips.map(c => c.name));

    // 아군/적군 속공 합산 추정
    const allyInOrder = battleOrder.filter(n => n && allyNames.has(n));
    const enemyInOrder = battleOrder.filter(n => n && enemyNames.has(n));

    // 합산 속공 (아군은 기본 25, 적군도 기본값으로 추정)
    const allyTotal = allChips
      .filter(c => allyNames.has(c.name))
      .reduce((s, c) => s + SPEED_BASE[c.type ?? "만능형"], 0);

    // 첫 타자 비교
    const firstAllyIdx = battleOrder.findIndex(n => n && allyNames.has(n));
    const firstEnemyIdx = battleOrder.findIndex(n => n && enemyNames.has(n));

    let msg = "";
    if (firstAllyIdx !== -1 && firstEnemyIdx !== -1) {
      if (firstAllyIdx < firstEnemyIdx) {
        msg = speedResult === "승"
          ? `✅ 아군이 먼저 행동 — 속공 따냄 (기본 합산 ${allyTotal})`
          : `⚠️ 순서상 아군이 먼저인데 속공 패 — 수치 재확인 필요`;
      } else {
        msg = speedResult === "패"
          ? `📌 적군이 먼저 행동 — 속공 잃음`
          : `⚠️ 순서상 적군이 먼저인데 속공 승 — 수치 재확인 필요`;
      }
    } else if (allyInOrder.length > 0) {
      msg = `🔵 아군만 입력됨 — 기본 합산 속공: ${allyTotal}`;
    } else if (enemyInOrder.length > 0) {
      msg = `🔴 적군만 입력됨`;
    } else {
      msg = "아군/적군 캐릭터를 전투 순서에 추가해주세요.";
    }

    setAnalysis(msg);
  }

  function SearchDropdown({
    query, setQuery, group, containerRef,
  }: {
    query: string; setQuery: (q: string) => void;
    group: "enemy" | "ally" | "other"; containerRef: React.RefObject<HTMLDivElement | null>;
  }) {
    const results = query.trim() ? searchHeroes(allHeroes, query).slice(0, 8) : [];
    const isActive = activeSearch === group;

    return (
      <div ref={containerRef} className="relative">
        <div className="flex gap-1.5">
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveSearch(group); }}
            onFocus={() => setActiveSearch(group)}
            placeholder="영웅 이름 검색"
            className="text-sm h-8"
          />
        </div>
        {isActive && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            {results.map(hero => {
              const ts = hero.type ? TYPE_STYLE[hero.type as HeroType] : null;
              return (
                <button
                  key={hero.name}
                  onMouseDown={(e) => { e.preventDefault(); addChip(hero, group); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  {ts && <span className={cn("w-2 h-2 rounded-full shrink-0", ts.dot)} />}
                  <span>{hero.name}</span>
                  {hero.type && <span className="ml-auto text-xs text-muted-foreground">{hero.type}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function ChipButton({ chip }: { chip: Chip }) {
    const ts = chip.type ? TYPE_STYLE[chip.type] : null;
    return (
      <button
        onClick={() => removeChip(chip.name)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-70",
          ts ? ts.className : "bg-muted text-muted-foreground"
        )}
      >
        {chip.name}
        <X size={9} />
      </button>
    );
  }

  return (
    <div className="max-w-md mx-auto rounded-2xl border border-border/50 bg-card overflow-hidden shadow-lg">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2 bg-muted/10">
        <Zap size={15} className="text-yellow-400" />
        <span className="font-bold text-sm">속공 계산기</span>
      </div>

      {/* 속공 결과 */}
      <div className="px-4 py-3 border-b border-border/20 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">⚡ 속공 결과</p>
        <div className="grid grid-cols-2 gap-2">
          {(["승", "패"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setSpeedResult(v); setAnalysis(null); }}
              className={cn(
                "py-2.5 rounded-xl text-sm font-black border-2 transition-all",
                speedResult === v
                  ? v === "승"
                    ? "bg-green-600/20 border-green-500 text-green-300"
                    : "bg-red-600/20 border-red-500 text-red-300"
                  : "border-border/50 text-muted-foreground hover:bg-accent/30"
              )}
            >
              {v === "승" ? "🏆 승리" : "💀 패배"}
            </button>
          ))}
        </div>
      </div>

      {/* 상대 방어팀 */}
      <div className="px-4 py-3 border-b border-border/20 space-y-2" ref={enemyRef}>
        <p className="text-xs font-semibold text-muted-foreground">
          🔴 상대 방어팀
          {enemyChips.length > 0 && (
            <span className="ml-1.5 font-normal text-muted-foreground/60">
              ({enemyChips.map(c => c.name).join(" ")})
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {enemyChips.map(c => <ChipButton key={c.name} chip={c} />)}
        </div>
        <SearchDropdown
          query={enemyQ} setQuery={setEnemyQ}
          group="enemy" containerRef={enemyRef}
        />
      </div>

      {/* 우리팀 공격덱 */}
      <div className="px-4 py-3 border-b border-border/20 space-y-2" ref={allyRef}>
        <p className="text-xs font-semibold text-muted-foreground">
          🔵 우리팀 공격덱
          {allyChips.length > 0 && (
            <span className="ml-1.5 font-normal text-muted-foreground/60">
              ({allyChips.map(c => c.name).join(" ")})
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {allyChips.map(c => <ChipButton key={c.name} chip={c} />)}
        </div>
        <SearchDropdown
          query={allyQ} setQuery={setAllyQ}
          group="ally" containerRef={allyRef}
        />
      </div>

      {/* 기타 캐릭터 검색 */}
      <div className="px-4 py-3 border-b border-border/20 space-y-2" ref={otherRef}>
        <button
          onClick={() => setShowOtherSearch(p => !p)}
          className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground"
        >
          <span>👥 기타 캐릭터 검색</span>
          {showOtherSearch ? <ChevronUp size={12} /> : <span className="text-muted-foreground/50">펼치기 ▼</span>}
        </button>
        {showOtherSearch && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {otherChips.map(c => <ChipButton key={c.name} chip={c} />)}
            </div>
            <SearchDropdown
              query={otherQ} setQuery={setOtherQ}
              group="other" containerRef={otherRef}
            />
          </div>
        )}
      </div>

      {/* 전투 순서 */}
      <div className="px-4 py-3 border-b border-border/20 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">🗡️ 전투 순서 (위에서 아래로)</p>
          <button
            onClick={resetAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
          >
            <RotateCcw size={10} className="mr-0.5" />전체 초기화
          </button>
        </div>
        <p className="text-xs text-muted-foreground/60">최대 6명, 최소 3명까지 입력 가능</p>
        <div className="space-y-1.5">
          {battleOrder.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted/40 flex items-center justify-center text-xs font-black shrink-0 text-muted-foreground">
                {idx + 1}
              </div>
              <select
                value={val}
                onChange={(e) => {
                  setBattleOrder(prev => prev.map((s, i) => i === idx ? e.target.value : s));
                  setAnalysis(null);
                }}
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
              >
                <option value="">선택</option>
                <optgroup label="🔴 상대 방어팀">
                  {enemyChips.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </optgroup>
                <optgroup label="🔵 우리팀 공격덱">
                  {allyChips.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </optgroup>
                {otherChips.length > 0 && (
                  <optgroup label="👥 기타">
                    {otherChips.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 분석 결과 */}
      {analysis && (
        <div className={cn(
          "mx-4 my-3 rounded-xl px-3 py-2.5 text-sm font-semibold border",
          analysis.startsWith("✅") ? "bg-green-500/10 border-green-500/30 text-green-400" :
          analysis.startsWith("📌") ? "bg-red-500/10 border-red-500/30 text-red-400" :
          analysis.startsWith("⚠️") ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
          "bg-muted/30 border-border text-muted-foreground"
        )}>
          {analysis}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <button
          onClick={handleAnalyze}
          className="py-3 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Zap size={14} />분석하기
        </button>
        <button
          onClick={() => alert("저장 기능 준비 중입니다.")}
          className="py-3 rounded-xl font-black text-sm bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1.5"
        >
          💾 저장하기
        </button>
      </div>
    </div>
  );
}
