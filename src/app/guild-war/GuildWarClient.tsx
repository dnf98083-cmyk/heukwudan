"use client";

import { useState, useEffect } from "react";
import { Swords, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp, Castle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const CASTLE_GROUPS = [
  { label: "외성", icon: "🏰", castles: ["외성 1", "외성 2", "외성 3", "외성 4", "외성 5"] },
  { label: "내성", icon: "🏛", castles: ["내성 1", "내성 2", "내성 3"] },
  { label: "본성", icon: "👑", castles: ["본성"] },
];

const ALL_CASTLES = CASTLE_GROUPS.flatMap((g) => g.castles);

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
  enemy_speed_ranges: { name: string; min: number; max: number }[] | null;
  ally_total: number;
  enemy_total: number;
  result: string | null;
  recorder_name: string;
  recorded_at: string;
}

// ── 기록 카드 (컴팩트) ──────────────────────────────────────────
function RecordCard({ r, isAdmin, onDelete }: {
  r: SpeedRecord; isAdmin: boolean; onDelete: () => void;
}) {
  const time = new Date(r.recorded_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const orderDisplay = r.battle_order.slice(0, 6).map((entry, i) => {
    const [team, ...rest] = entry.split(":");
    return { idx: i + 1, team, name: rest.join(":") };
  });

  const enemyRangeTotal = r.enemy_speed_ranges?.length
    ? {
        min: r.enemy_speed_ranges.reduce((s, x) => s + x.min, 0),
        max: r.enemy_speed_ranges.reduce((s, x) => s + x.max, 0),
      }
    : null;

  return (
    <div className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 bg-muted/5">
        {r.result ? (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-[10px] px-1.5 py-0",
              r.result === "승" ? "border-blue-500 text-blue-400" : "border-red-500 text-red-400"
            )}
          >
            {r.result}
          </Badge>
        ) : null}
        <span className="text-xs font-medium flex-1 truncate">
          {r.opponent_name ? `vs ${r.opponent_name}` : "상대 미입력"}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
        {isAdmin && (
          <button onClick={onDelete} className="text-muted-foreground hover:text-red-400 transition-colors">
            <Trash2 size={11} />
          </button>
        )}
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {/* 속공 순서 */}
        {orderDisplay.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {orderDisplay.map((o) => (
              <span
                key={o.idx}
                className={cn(
                  "inline-flex items-center gap-0.5 text-[10px] rounded px-1.5 py-0.5",
                  o.team === "enemy"
                    ? "bg-red-900/20 text-red-300 border border-red-500/30"
                    : "bg-blue-900/20 text-blue-300 border border-blue-500/30"
                )}
              >
                <span className="opacity-50">{o.idx}.</span>{o.name}
              </span>
            ))}
          </div>
        )}

        {/* 속공 수치 */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-blue-300">아군 합산 <strong>{r.ally_total}</strong></span>
          {enemyRangeTotal && (
            <span className="text-red-300">
              적군 추정 <strong>{enemyRangeTotal.min}~{enemyRangeTotal.max}</strong>
            </span>
          )}
        </div>

        {/* 기록자 + 공략 보러가기 */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">기록: {r.recorder_name}</p>
          {r.defense_team_id && (
            <a
              href={`/attack?team=${r.defense_team_id}`}
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={9} />공략 보러가기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 성 하나짜리 행 ──────────────────────────────────────────────
function CastleRow({ castle, records, isAdmin, onDelete }: {
  castle: string;
  records: SpeedRecord[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const wins = records.filter((r) => r.result === "승").length;
  const losses = records.filter((r) => r.result === "패").length;
  const hasRecords = records.length > 0;

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors",
          hasRecords
            ? "border-border/60 hover:bg-accent/20"
            : "border-border/30 text-muted-foreground hover:bg-accent/10"
        )}
      >
        <span className={cn("font-semibold text-xs", hasRecords ? "text-foreground" : "text-muted-foreground")}>
          {castle}
        </span>
        <div className="flex items-center gap-2">
          {hasRecords ? (
            <span className="text-[11px]">
              <span className="text-blue-400">{wins}승</span>
              {" · "}
              <span className="text-red-400">{losses}패</span>
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/60">기록 없음</span>
          )}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {expanded && (
        <div className="mt-1.5 pl-3 space-y-1.5">
          {records.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">기록이 없습니다.</p>
          ) : (
            records.map((r) => (
              <RecordCard
                key={r.id}
                r={r}
                isAdmin={isAdmin}
                onDelete={() => onDelete(r.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function GuildWarClient({ isAdmin }: { isAdmin: boolean }) {
  const [records, setRecords] = useState<SpeedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRecords() {
    setLoading(true);
    const { data } = await createClient()
      .from("speed_records")
      .select("*")
      .order("recorded_at", { ascending: false });
    setRecords((data ?? []) as SpeedRecord[]);
    setLoading(false);
  }

  useEffect(() => { fetchRecords(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await fetch(`/api/speed-records/${id}`, { method: "DELETE" });
    await fetchRecords();
  }

  async function handleResetAll() {
    if (!confirm("오늘의 길드전 기록을 전체 초기화할까요?")) return;
    await fetch("/api/speed-records", { method: "DELETE" });
    await fetchRecords();
  }

  const bycastle: Record<string, SpeedRecord[]> = {};
  for (const castle of ALL_CASTLES) bycastle[castle] = [];
  for (const r of records) {
    if (bycastle[r.castle_type]) bycastle[r.castle_type].push(r);
  }

  const totalWins = records.filter((r) => r.result === "승").length;
  const totalLosses = records.filter((r) => r.result === "패").length;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Swords size={20} />오늘의 길드전
          </h1>
          {records.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              총 {records.length}회 &nbsp;·&nbsp;
              <span className="text-blue-400">{totalWins}승</span>
              {" "}
              <span className="text-red-400">{totalLosses}패</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && records.length > 0 && (
            <button
              onClick={handleResetAll}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/40 rounded-lg px-2.5 py-1 hover:bg-red-500/10 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />전체 초기화
            </button>
          )}
          <button
            onClick={fetchRecords}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-16">불러오는 중...</p>
      ) : (
        <div className="space-y-5">
          {CASTLE_GROUPS.map((group) => (
            <div key={group.label}>
              {/* 그룹 헤더 */}
              <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                <span>{group.icon}</span>{group.label}
              </p>
              <div className="space-y-1.5">
                {group.castles.map((castle) => (
                  <CastleRow
                    key={castle}
                    castle={castle}
                    records={bycastle[castle] ?? []}
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* 분류 안 된 기록 */}
          {records.filter((r) => !ALL_CASTLES.includes(r.castle_type)).length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2">기타</p>
              <div className="space-y-1.5">
                {records
                  .filter((r) => !ALL_CASTLES.includes(r.castle_type))
                  .map((r) => (
                    <RecordCard key={r.id} r={r} isAdmin={isAdmin} onDelete={() => handleDelete(r.id)} />
                  ))}
              </div>
            </div>
          )}

          {records.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Castle size={36} className="opacity-20" />
              <p className="text-sm">오늘 기록된 길드전이 없습니다.</p>
              <p className="text-xs opacity-60">공격 후 속공 계산기에서 저장해보세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
