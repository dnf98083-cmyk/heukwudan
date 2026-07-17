"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, RotateCcw, X, Trash2, ExternalLink } from "lucide-react";
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

// ── 컴포넌트 밖에 정의 (내부 정의 시 렌더링마다 unmount → 한글 IME 깨짐) ──

function ChipBadge({ chip, onRemove }: { chip: Chip; onRemove?: (name: string) => void }) {
  const ts = chip.type ? TYPE_STYLE[chip.type] : null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
      ts ? ts.className : "bg-muted text-muted-foreground"
    )}>
      {chip.name}
      {chip.type && <span className="opacity-60 text-[10px]">({chip.type})</span>}
      {onRemove && (
        <button onClick={() => onRemove(chip.name)} className="hover:opacity-70"><X size={9} /></button>
      )}
    </span>
  );
}

function HeroSearch({
  group, allHeroes, used, onAdd, activeSearch, setActiveSearch, containerRef,
}: {
  group: "enemy" | "ally";
  allHeroes: Hero[];
  used: string[];
  onAdd: (hero: Hero, group: "enemy" | "ally") => void;
  activeSearch: string | null;
  setActiveSearch: (g: string | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [query, setQuery] = useState("");

  const available = allHeroes.filter((h) => !used.includes(h.name));
  const results = query.trim()
    ? available.filter((h) => h.name.includes(query)).slice(0, 8)
    : [];
  const isActive = activeSearch === group;

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActiveSearch(group); }}
        onFocus={() => setActiveSearch(group)}
        placeholder="영웅 이름 검색"
        className="text-sm h-8"
      />
      {isActive && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {results.map((hero) => {
            const ts = hero.type ? TYPE_STYLE[hero.type as HeroType] : null;
            return (
              <button
                key={hero.name}
                onMouseDown={(e) => { e.preventDefault(); onAdd(hero, group); setQuery(""); setActiveSearch(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <span>{hero.name}</span>
                {hero.type && <span className="ml-auto text-xs text-muted-foreground">{hero.type}</span>}
                {ts && <span className={cn("w-2 h-2 rounded-full shrink-0", ts.dot)} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 래퍼 (Suspense for useSearchParams) ──

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

  // URL params
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
  const [allySpeeds, setAllySpeeds] = useState<Record<string, string>>({});
  const [battleOrder, setBattleOrder] = useState<string[]>(Array(6).fill(""));
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [records, setRecords] = useState<SpeedRecord[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  const enemyRef = useRef<HTMLDivElement>(null);
  const allyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const db = createClient();
    db.from("heroes").select("*").order("name").then(({ data }) => {
      const heroes = (data ?? []) as Hero[];
      setAllHeroes(heroes);

      // pre-fill from URL params
      if (paramEnemy && !initialized) {
        const names = paramEnemy.split(",").filter(Boolean);
        setEnemyChips(names.map((n) => {
          const h = heroes.find((x) => x.name === n);
          return { name: n, type: (h?.type as HeroType | null) ?? null };
        }));
      }
      if (paramAlly && !initialized) {
        const names = paramAlly.split(",").filter(Boolean);
        setAllyChips(names.map((n) => {
          const h = heroes.find((x) => x.name === n);
          return { name: n, type: (h?.type as HeroType | null) ?? null };
        }));
      }
      setInitialized(true);
    });

    // fetch session role
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUserRole(d?.role ?? "")).catch(() => {});

    fetchRecords();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!enemyRef.current?.contains(e.target as Node) && !allyRef.current?.contains(e.target as Node)) {
        setActiveSearch(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchRecords() {
    const { data } = await createClient().from("speed_records").select("*").order("recorded_at", { ascending: false });
    setRecords((data ?? []) as SpeedRecord[]);
  }

  function addHero(hero: Hero, group: "enemy" | "ally") {
    const chip: Chip = { name: hero.name, type: hero.type as HeroType | null };
    if (group === "enemy") {
      setEnemyChips((p) => p.find((c) => c.name === hero.name) ? p : [...p, chip]);
    } else {
      setAllyChips((p) => p.find((c) => c.name === hero.name) ? p : [...p, chip]);
    }
  }

  function removeChip(name: string) {
    setEnemyChips((p) => p.filter((c) => c.name !== name));
    setAllyChips((p) => p.filter((c) => c.name !== name));
    setBattleOrder((p) => p.map((s) => s === name ? "" : s));
    setAllySpeeds((p) => { const n = { ...p }; delete n[name]; return n; });
  }

  // 적군 속공 추정 (SPEED_BASE 기반)
  const enemySpeeds: Record<string, number> = {};
  for (const c of enemyChips) {
    enemySpeeds[c.name] = SPEED_BASE[c.type ?? "만능형"];
  }

  const allyTotal = allyChips.reduce((s, c) => s + (Number(allySpeeds[c.name]) || 0), 0);
  const enemyTotal = Object.values(enemySpeeds).reduce((s, v) => s + v, 0);

  const allChips = [...enemyChips, ...allyChips];
  const usedNames = [...enemyChips.map((c) => c.name), ...allyChips.map((c) => c.name)];

  const isAdmin = ["슈퍼개발자", "관리자"].includes(userRole);

  async function handleSave() {
    if (!castle) { setSaveMsg("성을 선택해주세요."); return; }
    if (!playerName.trim()) { setSaveMsg("기록자 이름을 입력해주세요."); return; }
    if (allyChips.length === 0 && enemyChips.length === 0) { setSaveMsg("영웅을 추가해주세요."); return; }

    setSaving(true);
    setSaveMsg(null);

    const allySpeedsNum: Record<string, number> = {};
    for (const c of allyChips) allySpeedsNum[c.name] = Number(allySpeeds[c.name]) || 0;

    const body = {
      castle_type: castle,
      opponent_name: opponent.trim() || null,
      enemy_heroes: enemyChips.map((c) => c.name),
      ally_heroes: allyChips.map((c) => c.name),
      deck_id: paramDeckId || null,
      defense_team_id: paramTeamId || null,
      battle_order: battleOrder.filter(Boolean),
      ally_speeds: allySpeedsNum,
      enemy_speeds: enemySpeeds,
      ally_total: allyTotal,
      enemy_total: enemyTotal,
      recorder_name: playerName.trim(),
    };

    const res = await fetch("/api/speed-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setSaveMsg("✅ 저장되었습니다.");
      await fetchRecords();
    } else {
      setSaveMsg("❌ 저장 실패. 다시 시도해주세요.");
    }
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

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* ── 기본 정보 ── */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2 bg-muted/10">
          <Zap size={15} className="text-yellow-400" />
          <span className="font-bold text-sm">속공 계산기</span>
          {(paramCastle || paramOpponent) && (
            <button
              onClick={() => router.push("/speed-calc")}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              초기화
            </button>
          )}
        </div>

        <div className="px-4 py-3 border-b border-border/20 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">🏰 공격한 성</p>
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
            <Input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="상대 닉네임"
              className="h-9"
            />
          </div>
        </div>

        {/* ── 상대 방어팀 ── */}
        <div className="px-4 py-3 border-b border-border/20 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">🔴 상대 방어팀</p>
          <div className="flex flex-wrap gap-1.5">
            {enemyChips.map((c) => (
              <ChipBadge key={c.name} chip={c} onRemove={removeChip} />
            ))}
          </div>
          {enemyChips.length < 3 && (
            <HeroSearch
              group="enemy"
              allHeroes={allHeroes}
              used={usedNames}
              onAdd={addHero}
              activeSearch={activeSearch}
              setActiveSearch={setActiveSearch}
              containerRef={enemyRef}
            />
          )}
          {enemyChips.length >= 3 && (
            <p className="text-xs text-muted-foreground">3명 선택됨</p>
          )}
        </div>

        {/* ── 우리 공격덱 ── */}
        <div className="px-4 py-3 border-b border-border/20 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">🔵 우리 공격덱</p>
          <div className="flex flex-wrap gap-1.5">
            {allyChips.map((c) => (
              <ChipBadge key={c.name} chip={c} onRemove={removeChip} />
            ))}
          </div>
          {allyChips.length < 3 && (
            <HeroSearch
              group="ally"
              allHeroes={allHeroes}
              used={usedNames}
              onAdd={addHero}
              activeSearch={activeSearch}
              setActiveSearch={setActiveSearch}
              containerRef={allyRef}
            />
          )}
          {allyChips.length >= 3 && (
            <p className="text-xs text-muted-foreground">3명 선택됨</p>
          )}
        </div>

        {/* ── 속공 수치 입력 ── */}
        <div className="px-4 py-3 border-b border-border/20 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">⚡ 속공 수치</p>

          {allyChips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-blue-400 font-medium">🔵 우리팀 (직접 입력)</p>
              {allyChips.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <ChipBadge chip={c} />
                  <Input
                    type="number"
                    min={0}
                    value={allySpeeds[c.name] ?? ""}
                    onChange={(e) => setAllySpeeds((p) => ({ ...p, [c.name]: e.target.value }))}
                    placeholder="속공 값"
                    className="w-24 h-8 text-sm"
                  />
                </div>
              ))}
              <div className="text-xs font-bold text-blue-300">
                우리 합산: <span className="text-base">{allyTotal}</span>
              </div>
            </div>
          )}

          {enemyChips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-red-400 font-medium">🔴 상대팀 (역할군 기본값 추정)</p>
              {enemyChips.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <ChipBadge chip={c} />
                  <span className="text-sm font-semibold text-muted-foreground w-10">
                    {enemySpeeds[c.name]}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    ({c.type ?? "??"} 기본값)
                  </span>
                </div>
              ))}
              <div className="text-xs font-bold text-red-300">
                상대 합산 (추정): <span className="text-base">{enemyTotal}</span>
              </div>
            </div>
          )}

          {(allyChips.length > 0 || enemyChips.length > 0) && (
            <div className={cn(
              "rounded-xl px-3 py-2 text-sm font-bold border",
              allyTotal > enemyTotal
                ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                : allyTotal < enemyTotal
                  ? "bg-red-500/10 border-red-500/40 text-red-300"
                  : "bg-muted/20 border-border text-muted-foreground"
            )}>
              {allyTotal > enemyTotal
                ? `✅ 우리팀 속공 우세 (${allyTotal} > ${enemyTotal})`
                : allyTotal < enemyTotal
                  ? `❌ 상대 속공 우세 (${enemyTotal} > ${allyTotal})`
                  : `⚖️ 속공 동점 (${allyTotal})`}
            </div>
          )}
        </div>

        {/* ── 전투 순서 ── */}
        <div className="px-4 py-3 border-b border-border/20 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">🗡️ 실제 전투 순서</p>
            <button
              onClick={() => setBattleOrder(Array(6).fill(""))}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RotateCcw size={10} />초기화
            </button>
          </div>
          <div className="space-y-1.5">
            {battleOrder.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted/40 flex items-center justify-center text-xs font-black shrink-0 text-muted-foreground">
                  {idx + 1}
                </div>
                <select
                  value={val}
                  onChange={(e) => setBattleOrder((p) => p.map((s, i) => i === idx ? e.target.value : s))}
                  className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                >
                  <option value="">선택 안 함</option>
                  {enemyChips.length > 0 && (
                    <optgroup label="🔴 상대 방어팀">
                      {enemyChips.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  )}
                  {allyChips.length > 0 && (
                    <optgroup label="🔵 우리팀 공격덱">
                      {allyChips.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* ── 기록자 & 저장 ── */}
        <div className="px-4 py-3 space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">기록자 닉네임</p>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="내 닉네임"
              className="h-9"
            />
          </div>
          {saveMsg && (
            <p className={cn(
              "text-xs font-medium",
              saveMsg.startsWith("✅") ? "text-green-400" : "text-red-400"
            )}>
              {saveMsg}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-black text-sm bg-yellow-500 hover:bg-yellow-400 text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Zap size={14} />
            {saving ? "저장 중..." : "속공 기록 저장"}
          </button>
        </div>
      </div>

      {/* ── 속공 기록 목록 ── */}
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
            <SpeedRecordCard
              key={r.id}
              record={r}
              isAdmin={isAdmin}
              onDelete={handleDeleteRecord}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SpeedRecordCard({
  record: r, isAdmin, onDelete,
}: {
  record: SpeedRecord;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const allyWin = r.ally_total > r.enemy_total;
  const enemyWin = r.enemy_total > r.ally_total;

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden text-sm shadow-sm">
      {/* 헤더 */}
      <div className="px-4 py-2.5 bg-muted/10 border-b border-border/30 flex items-center gap-2">
        <span className="font-bold text-xs">🏰 {r.castle_type}</span>
        {r.opponent_name && (
          <span className="text-xs text-muted-foreground">vs {r.opponent_name}</span>
        )}
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
        {/* 방어팀 / 공격덱 */}
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
              <a
                href={`/attack?team=${r.defense_team_id}`}
                className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <ExternalLink size={9} />공략 보기
              </a>
            )}
          </div>
        </div>

        {/* 속공 수치 */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-blue-300 font-bold">우리 {r.ally_total}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-red-300 font-bold">상대 {r.enemy_total} (추정)</span>
        </div>

        {/* 메타 */}
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
