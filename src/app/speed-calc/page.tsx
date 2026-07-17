"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, RotateCcw, X, Trash2, ExternalLink, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TYPE_STYLE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Hero, HeroType } from "@/types";

const SPEED_BASE: Record<HeroType, number> = {
  방어형: 19, 지원형: 19, 만능형: 25, 마법형: 29, 공격형: 29,
};

const CASTLE_TYPES = ["외성 1", "외성 2", "외성 3", "외성 4", "외성 5", "내성 1", "내성 2", "내성 3", "본성"];

interface Chip { name: string; type: HeroType | null }

// 전투 순서 슬롯 — 이름+팀을 같이 저장해 동명 캐릭터 구분
type TeamType = "enemy" | "ally" | "other";
interface OrderSlot { name: string; team: TeamType | "" }
const EMPTY_SLOT: OrderSlot = { name: "", team: "" };

interface SpeedRecord {
  id: string;
  castle_type: string;
  opponent_name: string | null;
  enemy_heroes: string[];
  ally_heroes: string[];
  deck_id: string | null;
  defense_team_id: string | null;
  battle_order: string[];
  ally_speeds: Record<string, number>;
  enemy_speeds: Record<string, number>;
  ally_total: number;
  enemy_total: number;
  recorder_name: string;
  recorded_at: string;
}

// ── 모듈 스코프 컴포넌트 (한글 IME 보호) ─────────────────────────────────

function HeroSearch({
  group, allHeroes, used, onAdd, activeSearch, setActiveSearch, containerRef,
}: {
  group: TeamType;
  allHeroes: Hero[];
  used: string[];
  onAdd: (hero: Hero, group: TeamType) => void;
  activeSearch: string | null;
  setActiveSearch: (g: string | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [query, setQuery] = useState("");
  const available = allHeroes.filter((h) => !used.includes(h.name));
  const results = query.trim() ? available.filter((h) => h.name.includes(query)).slice(0, 8) : [];
  const isActive = activeSearch === group;

  return (
    <div ref={containerRef} className="relative mt-1.5">
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActiveSearch(group); }}
        onFocus={() => setActiveSearch(group)}
        placeholder="영웅 이름 검색"
        className="text-xs h-7"
      />
      {isActive && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {results.map((hero) => {
            const ts = hero.type ? TYPE_STYLE[hero.type as HeroType] : null;
            return (
              <button
                key={hero.name}
                onMouseDown={(e) => { e.preventDefault(); onAdd(hero, group); setQuery(""); setActiveSearch(null); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <span>{hero.name}</span>
                {hero.type && ts && (
                  <span className={cn("ml-auto text-[10px] rounded px-1.5 py-0.5 shrink-0", ts.className)}>
                    {hero.type}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 전투 순서 슬롯 — team 정보 기반으로 적군/아군 구분
function BattleSlot({
  idx, slot, enemyChips, allyChips, allySpeeds, setAllySpeeds, onClear,
}: {
  idx: number;
  slot: OrderSlot;
  enemyChips: Chip[];
  allyChips: Chip[];
  allySpeeds: Record<string, string>;
  setAllySpeeds: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onClear: () => void;
}) {
  const isEnemy = slot.team === "enemy";
  const isAlly = slot.team === "ally";
  const chip = isEnemy
    ? enemyChips.find((c) => c.name === slot.name)
    : isAlly
      ? allyChips.find((c) => c.name === slot.name)
      : null;

  if (slot.name) {
    return (
      <div className={cn(
        "rounded-lg border overflow-hidden",
        isEnemy ? "border-red-700/50" : "border-blue-700/50"
      )}>
        {/* 헤더 */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold",
          isEnemy ? "bg-red-950/40 text-red-400" : "bg-blue-950/40 text-blue-400"
        )}>
          <span
            className="rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
            style={{ width: 18, height: 18, background: isEnemy ? "#dc2626" : "#2563eb" }}
          >
            {idx + 1}
          </span>
          {isEnemy ? "적군" : "아군"}
          <button onClick={onClear} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <X size={12} />
          </button>
        </div>
        {/* 내용 */}
        <div className="flex items-center gap-2 px-2.5 py-2">
          <span className="text-sm font-medium flex-1">{slot.name}</span>
          {isEnemy && chip?.type && (
            <span className="shrink-0 text-[10px] rounded px-1.5 py-0.5 border border-red-500/40 text-red-300">
              {chip.type}
            </span>
          )}
          {isAlly && (
            <div className="flex items-center gap-1 shrink-0">
              <Input
                type="number"
                min={0}
                value={allySpeeds[slot.name] ?? ""}
                onChange={(e) => setAllySpeeds((p) => ({ ...p, [slot.name]: e.target.value }))}
                placeholder="속공"
                className="w-16 h-6 text-xs px-2"
              />
              <Zap size={11} className="text-yellow-400 shrink-0" />
            </div>
          )}
        </div>
        {isEnemy && chip?.type && (
          <div className="px-2.5 pb-1.5 text-[10px] text-muted-foreground/60">
            기본 속공 추정: {SPEED_BASE[chip.type]}
          </div>
        )}
      </div>
    );
  }

  // 빈 슬롯
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <span
        className="rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-muted-foreground bg-muted/40"
        style={{ width: 20, height: 20 }}
      >
        {idx + 1}
      </span>
      <span className="text-xs text-muted-foreground/50 flex-1 italic">
        위 캐릭터 이름을 눌러 추가
      </span>
    </div>
  );
}

// ── 기록 카드 ─────────────────────────────────────────────────────────────

function SpeedRecordCard({ record: r, isAdmin, onDelete }: {
  record: SpeedRecord; isAdmin: boolean; onDelete: (id: string) => void;
}) {
  const allyWin = r.ally_total > r.enemy_total;
  const enemyWin = r.enemy_total > r.ally_total;
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden text-sm shadow-sm">
      <div className="px-4 py-2.5 bg-muted/10 border-b border-border/30 flex items-center gap-2">
        <span className="font-bold text-xs">🏰 {r.castle_type}</span>
        {r.opponent_name && <span className="text-xs text-muted-foreground">vs {r.opponent_name}</span>}
        <span className={cn(
          "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
          allyWin ? "bg-blue-500/20 text-blue-300" : enemyWin ? "bg-red-500/20 text-red-300" : "bg-muted text-muted-foreground"
        )}>
          {allyWin ? "우리 속공 우세" : enemyWin ? "상대 속공 우세" : "동점"}
        </span>
        {isAdmin && (
          <button onClick={() => onDelete(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">🔴 상대 방어팀</p>
            <div className="flex flex-wrap gap-1">
              {r.enemy_heroes.map((name) => (
                <Badge key={name} variant="outline" className="text-[10px] border-red-500/40 text-red-300 px-1.5">{name}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">🔵 공격덱</p>
            <div className="flex flex-wrap gap-1">
              {r.ally_heroes.map((name) => (
                <Badge key={name} variant="outline" className="text-[10px] border-blue-500/40 text-blue-300 px-1.5">{name}</Badge>
              ))}
            </div>
            {r.defense_team_id && (
              <a href={`/attack?team=${r.defense_team_id}`} className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground">
                <ExternalLink size={9} />공략 보기
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-blue-300 font-bold">우리 {r.ally_total}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-red-300 font-bold">상대 {r.enemy_total} (추정)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t border-border/30 pt-2">
          <span>기록: {r.recorder_name}</span>
          <span className="ml-auto">
            {new Date(r.recorded_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 페이지 래퍼 ───────────────────────────────────────────────────────────

export default function SpeedCalcPageWrapper() {
  return (
    <Suspense>
      <SpeedCalcPage />
    </Suspense>
  );
}

function SpeedCalcPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramCastle = searchParams.get("castle") ?? "";
  const paramOpponent = searchParams.get("opponent") ?? "";
  const paramEnemy = searchParams.get("enemy") ?? "";
  const paramAlly = searchParams.get("ally") ?? "";
  const paramDeckId = searchParams.get("deckId") ?? "";
  const paramTeamId = searchParams.get("teamId") ?? "";
  const paramPlayer = searchParams.get("playerName") ?? "";

  const [allHeroes, setAllHeroes] = useState<Hero[]>([]);
  const [castle, setCastle] = useState(paramCastle || CASTLE_TYPES[0]);
  const [opponent, setOpponent] = useState(paramOpponent);
  const [playerName, setPlayerName] = useState(paramPlayer);
  const [enemyChips, setEnemyChips] = useState<Chip[]>([]);
  const [allyChips, setAllyChips] = useState<Chip[]>([]);
  const [otherChips, setOtherChips] = useState<Chip[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [allySpeeds, setAllySpeeds] = useState<Record<string, string>>({});
  const [battleOrder, setBattleOrder] = useState<OrderSlot[]>(Array(6).fill(null).map(() => ({ ...EMPTY_SLOT })));
  const [speedResult, setSpeedResult] = useState<"승" | "패">("승");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [records, setRecords] = useState<SpeedRecord[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  const enemyRef = useRef<HTMLDivElement>(null);
  const allyRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().from("heroes").select("*").order("name").then(({ data }) => {
      const heroes = (data ?? []) as Hero[];
      setAllHeroes(heroes);
      if (!initialized) {
        if (paramEnemy) {
          setEnemyChips(paramEnemy.split(",").filter(Boolean).map((n) => {
            const h = heroes.find((x) => x.name === n);
            return { name: n, type: (h?.type as HeroType | null) ?? null };
          }));
        }
        if (paramAlly) {
          setAllyChips(paramAlly.split(",").filter(Boolean).map((n) => {
            const h = heroes.find((x) => x.name === n);
            return { name: n, type: (h?.type as HeroType | null) ?? null };
          }));
        }
        setInitialized(true);
      }
    });
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUserRole(d?.role ?? "")).catch(() => {});
    fetchRecords();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const refs = [enemyRef, allyRef, otherRef];
      if (refs.every((r) => !r.current?.contains(e.target as Node))) setActiveSearch(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchRecords() {
    const { data } = await createClient().from("speed_records").select("*").order("recorded_at", { ascending: false });
    setRecords((data ?? []) as SpeedRecord[]);
  }

  function addHero(hero: Hero, group: TeamType) {
    const chip: Chip = { name: hero.name, type: hero.type as HeroType | null };
    if (group === "enemy") setEnemyChips((p) => p.find((c) => c.name === hero.name) ? p : [...p, chip]);
    else if (group === "ally") setAllyChips((p) => p.find((c) => c.name === hero.name) ? p : [...p, chip]);
    else setOtherChips((p) => p.find((c) => c.name === hero.name) ? p : [...p, chip]);
  }

  function removeChip(name: string, team: TeamType) {
    if (team === "enemy") setEnemyChips((p) => p.filter((c) => c.name !== name));
    else if (team === "ally") setAllyChips((p) => p.filter((c) => c.name !== name));
    else setOtherChips((p) => p.filter((c) => c.name !== name));
    // 전투 순서에서도 해당 팀의 해당 영웅 제거
    setBattleOrder((p) => p.map((s) => s.name === name && s.team === team ? { ...EMPTY_SLOT } : s));
    if (team === "ally") setAllySpeeds((p) => { const n = { ...p }; delete n[name]; return n; });
    setAnalysis(null);
  }

  // 칩 클릭 → 다음 빈 슬롯에 순서대로 채우기
  function fillNextSlot(name: string, team: TeamType) {
    setBattleOrder((prev) => {
      // 이미 이 팀의 이 영웅이 슬롯에 있으면 제거(토글)
      const existingIdx = prev.findIndex((s) => s.name === name && s.team === team);
      if (existingIdx !== -1) {
        return prev.map((s, i) => i === existingIdx ? { ...EMPTY_SLOT } : s);
      }
      // 다음 빈 슬롯에 채우기
      const nextEmpty = prev.findIndex((s) => !s.name);
      if (nextEmpty === -1) return prev;
      return prev.map((s, i) => i === nextEmpty ? { name, team } : s);
    });
    setAnalysis(null);
  }

  function clearSlot(idx: number) {
    setBattleOrder((p) => p.map((s, i) => i === idx ? { ...EMPTY_SLOT } : s));
    setAnalysis(null);
  }

  // 각 팀별로 별도의 used 목록 (같은 이름이 두 팀에 가능)
  const enemyUsed = enemyChips.map((c) => c.name);
  const allyUsed = allyChips.map((c) => c.name);
  const otherUsed = otherChips.map((c) => c.name);
  // 검색 드롭다운에서 제외할 이름: 같은 팀 내 이미 선택된 것만 제외
  // (다른 팀에 있어도 이 팀에 추가 가능)

  const enemySpeeds: Record<string, number> = {};
  for (const c of enemyChips) enemySpeeds[c.name] = SPEED_BASE[c.type ?? "만능형"];

  const allyTotal = allyChips.reduce((s, c) => s + (Number(allySpeeds[c.name]) || 0), 0);
  const enemyTotal = Object.values(enemySpeeds).reduce((s, v) => s + v, 0);

  // 배치된 슬롯 — name+team 조합으로 구분
  const placedSet = new Set(battleOrder.filter((s) => s.name).map((s) => `${s.team}:${s.name}`));
  const isAdmin = ["슈퍼개발자", "관리자"].includes(userRole);

  function handleAnalyze() {
    const filled = battleOrder.filter((s) => s.name);
    if (filled.length === 0) { setAnalysis("전투 순서를 입력해주세요."); return; }
    const firstAllyIdx = battleOrder.findIndex((s) => s.name && s.team === "ally");
    const firstEnemyIdx = battleOrder.findIndex((s) => s.name && s.team === "enemy");
    let msg = "";
    if (firstAllyIdx !== -1 && firstEnemyIdx !== -1) {
      if (firstAllyIdx < firstEnemyIdx)
        msg = speedResult === "승" ? `✅ 아군 선행 — 속공 따냄 (우리 합산 ${allyTotal})` : `⚠️ 순서상 아군 선행인데 속공 패 — 수치 재확인`;
      else
        msg = speedResult === "패" ? `📌 적군 선행 — 속공 잃음 (상대 추정 ${enemyTotal})` : `⚠️ 순서상 적군 선행인데 속공 승 — 수치 재확인`;
    } else if (firstAllyIdx !== -1) {
      msg = `🔵 아군만 배치됨 — 합산 속공 ${allyTotal}`;
    } else {
      msg = `🔴 적군만 배치됨 — 추정 속공 ${enemyTotal}`;
    }
    setAnalysis(msg);
  }

  async function handleSave() {
    if (!playerName.trim()) { setSaveMsg("기록자 이름을 입력해주세요."); return; }
    if (allyChips.length === 0 && enemyChips.length === 0) { setSaveMsg("영웅을 추가해주세요."); return; }
    setSaving(true); setSaveMsg(null);
    const allySpeedsNum: Record<string, number> = {};
    for (const c of allyChips) allySpeedsNum[c.name] = Number(allySpeeds[c.name]) || 0;
    const res = await fetch("/api/speed-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        castle_type: castle,
        opponent_name: opponent.trim() || null,
        enemy_heroes: enemyChips.map((c) => c.name),
        ally_heroes: allyChips.map((c) => c.name),
        deck_id: paramDeckId || null,
        defense_team_id: paramTeamId || null,
        battle_order: battleOrder.filter((s) => s.name).map((s) => `${s.team}:${s.name}`),
        ally_speeds: allySpeedsNum,
        enemy_speeds: enemySpeeds,
        ally_total: allyTotal,
        enemy_total: enemyTotal,
        recorder_name: playerName.trim(),
      }),
    });
    setSaving(false);
    if (res.ok) { setSaveMsg("✅ 저장되었습니다."); await fetchRecords(); }
    else setSaveMsg("❌ 저장 실패. 다시 시도해주세요.");
  }

  async function handleDeleteRecord(id: string) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await fetch(`/api/speed-records/${id}`, { method: "DELETE" });
    await fetchRecords();
  }

  async function handleResetAll() {
    if (!confirm("속공 기록을 전체 초기화할까요?")) return;
    await fetch("/api/speed-records", { method: "DELETE" });
    await fetchRecords();
  }

  // ── 칩 렌더 ──────────────────────────────────────────────────────────────
  function ChipItem({ chip, team, colorBase }: { chip: Chip; team: TeamType; colorBase: string }) {
    const ts = chip.type ? TYPE_STYLE[chip.type] : null;
    const placed = placedSet.has(`${team}:${chip.name}`);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border cursor-pointer select-none transition-opacity",
          ts ? ts.className : colorBase,
          placed ? "opacity-100" : "opacity-60"
        )}
        onClick={() => fillNextSlot(chip.name, team)}
      >
        <span className="text-[10px] mr-0.5">{placed ? "✓" : "●"}</span>
        {chip.name}
        <button
          onClick={(e) => { e.stopPropagation(); removeChip(chip.name, team); }}
          className="ml-0.5 hover:opacity-60 transition-opacity"
        >
          <X size={9} />
        </button>
      </span>
    );
  }

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-lg">
        {/* 헤더 */}
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2 bg-gradient-to-r from-blue-900/30 to-cyan-900/20">
          <Zap size={15} className="text-yellow-400" />
          <span className="font-bold text-sm">속공 계산기</span>
          {(paramCastle || paramOpponent) && (
            <span className="text-xs text-muted-foreground ml-1">
              {paramCastle && `· ${paramCastle}`}{paramOpponent && ` · ${paramOpponent}`}
            </span>
          )}
          {(paramCastle || paramOpponent) && (
            <button
              onClick={() => router.push("/speed-calc")}
              className="ml-auto rounded-full bg-muted/30 p-1 hover:bg-muted/60 transition-colors"
            >
              <X size={13} className="text-muted-foreground" />
            </button>
          )}
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
        <div className="px-4 py-3 border-b border-border/20 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            🔴 상대 방어팀
            {enemyChips.length > 0 && (
              <span className="ml-1.5 font-normal opacity-60">({enemyChips.map((c) => c.name).join(" ")})</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {enemyChips.map((c) => (
              <ChipItem key={c.name} chip={c} team="enemy" colorBase="bg-red-900/40 text-red-300 border-red-700/40" />
            ))}
          </div>
          {enemyChips.length < 3 && (
            <HeroSearch group="enemy" allHeroes={allHeroes} used={enemyUsed} onAdd={addHero}
              activeSearch={activeSearch} setActiveSearch={setActiveSearch} containerRef={enemyRef} />
          )}
        </div>

        {/* 우리팀 공격덱 */}
        <div className="px-4 py-3 border-b border-border/20 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            🔵 우리팀 공격덱
            {allyChips.length > 0 && (
              <span className="ml-1.5 font-normal opacity-60">({allyChips.map((c) => c.name).join(" ")})</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allyChips.map((c) => (
              <ChipItem key={c.name} chip={c} team="ally" colorBase="bg-blue-900/40 text-blue-300 border-blue-700/40" />
            ))}
          </div>
          {allyChips.length < 3 && (
            <HeroSearch group="ally" allHeroes={allHeroes} used={allyUsed} onAdd={addHero}
              activeSearch={activeSearch} setActiveSearch={setActiveSearch} containerRef={allyRef} />
          )}
        </div>

        {/* 기타 캐릭터 검색 */}
        <div className="px-4 py-2.5 border-b border-border/20">
          <button
            onClick={() => setShowOther((p) => !p)}
            className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground"
          >
            <span>👥 기타 캐릭터 검색</span>
            {showOther ? <ChevronUp size={12} /> : <span className="text-muted-foreground/50 text-[11px]">펼치기 ▼</span>}
          </button>
          {showOther && (
            <div className="mt-2 space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {otherChips.map((c) => (
                  <ChipItem key={c.name} chip={c} team="other" colorBase="bg-muted text-muted-foreground border-border/40" />
                ))}
              </div>
              <HeroSearch group="other" allHeroes={allHeroes} used={otherUsed} onAdd={addHero}
                activeSearch={activeSearch} setActiveSearch={setActiveSearch} containerRef={otherRef} />
            </div>
          )}
        </div>

        {/* 전투 순서 */}
        <div className="px-4 py-3 border-b border-border/20 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">🗡️ 전투 순서 (위에서 아래로)</p>
            <button
              onClick={() => { setBattleOrder(Array(6).fill(null).map(() => ({ ...EMPTY_SLOT }))); setAnalysis(null); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <RotateCcw size={10} />전체 초기화
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60">아군 최대 3개, 적군 최대 3개까지 입력 가능</p>
          <div className="space-y-2">
            {battleOrder.map((slot, idx) => (
              <BattleSlot
                key={idx}
                idx={idx}
                slot={slot}
                enemyChips={enemyChips}
                allyChips={allyChips}
                allySpeeds={allySpeeds}
                setAllySpeeds={setAllySpeeds}
                onClear={() => clearSlot(idx)}
              />
            ))}
          </div>
        </div>

        {/* 분석 결과 */}
        {analysis && (
          <div className={cn(
            "mx-4 my-2 rounded-xl px-3 py-2.5 text-sm font-semibold border",
            analysis.startsWith("✅") ? "bg-green-500/10 border-green-500/30 text-green-400" :
            analysis.startsWith("📌") ? "bg-red-500/10 border-red-500/30 text-red-400" :
            analysis.startsWith("⚠️") ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
            "bg-muted/30 border-border text-muted-foreground"
          )}>
            {analysis}
          </div>
        )}

        {/* 기록자 + 성 + 버튼 */}
        <div className="px-4 py-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">🏰 성</p>
              <select
                value={castle}
                onChange={(e) => setCastle(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                {CASTLE_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">🎭 상대 닉네임</p>
              <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="상대 닉네임" className="h-9" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">기록자</p>
            <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="내 닉네임" className="h-9" />
          </div>
          {saveMsg && (
            <p className={cn("text-xs font-medium", saveMsg.startsWith("✅") ? "text-green-400" : "text-red-400")}>
              {saveMsg}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAnalyze}
              className="py-3 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap size={14} />분석하기
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="py-3 rounded-xl font-black text-sm bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              💾 {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </div>

      {/* 속공 기록 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">📋 속공 기록</p>
          {isAdmin && records.length > 0 && (
            <button
              onClick={handleResetAll}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/40 rounded-lg px-2.5 py-1 hover:bg-red-500/10 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />전체 초기화
            </button>
          )}
        </div>
        {records.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">기록이 없습니다.</p>
        ) : (
          records.map((r) => (
            <SpeedRecordCard key={r.id} record={r} isAdmin={isAdmin} onDelete={handleDeleteRecord} />
          ))
        )}
      </div>
    </div>
  );
}
