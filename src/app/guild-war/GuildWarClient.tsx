"use client";

import { useState, useEffect } from "react";
import { Swords, RefreshCw, Trash2, ExternalLink, Castle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const CASTLE_TYPES = [
  "외성 1", "외성 2", "외성 3", "외성 4", "외성 5",
  "내성 1", "내성 2", "내성 3", "본성",
];

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

function RecordCard({ r, isAdmin, onDelete }: {
  r: SpeedRecord; isAdmin: boolean; onDelete: () => void;
}) {
  const time = new Date(r.recorded_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  // 배틀 순서에서 적군/아군 순서 재구성
  const orderDisplay = r.battle_order.slice(0, 6).map((entry, i) => {
    const [team, ...rest] = entry.split(":");
    const name = rest.join(":");
    return { idx: i + 1, team, name };
  });

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden text-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/10 border-b border-border/30">
        {r.result && (
          <Badge
            variant="outline"
            className={r.result === "승" ? "border-blue-500 text-blue-400 shrink-0 text-[10px]" : "border-red-500 text-red-400 shrink-0 text-[10px]"}
          >
            {r.result}
          </Badge>
        )}
        <span className="font-semibold text-xs">
          {r.opponent_name ? `vs ${r.opponent_name}` : "상대 미입력"}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">{time}</span>
        {isAdmin && (
          <button onClick={onDelete} className="text-muted-foreground hover:text-red-400 transition-colors ml-1">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {/* 방어팀 & 공격덱 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">🔴 방어팀</p>
            <div className="flex flex-wrap gap-1">
              {r.enemy_heroes.map((name) => (
                <span key={name} className="text-[10px] border border-red-500/30 text-red-300 rounded px-1.5 py-0.5 bg-red-900/10">
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">🔵 공격덱</p>
            <div className="flex flex-wrap gap-1">
              {r.ally_heroes.map((name) => (
                <span key={name} className="text-[10px] border border-blue-500/30 text-blue-300 rounded px-1.5 py-0.5 bg-blue-900/10">
                  {name}
                </span>
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

        {/* 전투 순서 */}
        {orderDisplay.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">⚡ 속공 순서</p>
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
                  <span className="opacity-60">{o.idx}.</span>{o.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 속공 수치 */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-blue-300">
            아군 합산 <strong>{r.ally_total}</strong>
          </span>
          {r.enemy_speed_ranges && r.enemy_speed_ranges.length > 0 ? (
            <span className="text-red-300">
              적군 추정{" "}
              <strong>
                {r.enemy_speed_ranges.reduce((s, x) => s + x.min, 0)}
                ~
                {r.enemy_speed_ranges.reduce((s, x) => s + x.max, 0)}
              </strong>
            </span>
          ) : (
            <span className="text-red-300">
              적군 추정 <strong>{r.enemy_total}</strong>
            </span>
          )}
        </div>

        {/* 기록자 */}
        <p className="text-[10px] text-muted-foreground">기록: {r.recorder_name}</p>
      </div>
    </div>
  );
}

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

  // 성별로 그룹핑
  const bycastle: Record<string, SpeedRecord[]> = {};
  for (const r of records) {
    if (!bycastle[r.castle_type]) bycastle[r.castle_type] = [];
    bycastle[r.castle_type].push(r);
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
              &nbsp;
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
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Castle size={36} className="opacity-20" />
          <p className="text-sm">오늘 기록된 길드전이 없습니다.</p>
          <p className="text-xs opacity-60">공격 후 속공 계산기에서 저장해보세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 기록 있는 성 순서대로 */}
          {CASTLE_TYPES.filter((c) => bycastle[c]?.length).map((castle) => (
            <div key={castle}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded px-2 py-0.5">
                  🏰 {castle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {bycastle[castle].length}회
                  {" · "}
                  <span className="text-blue-400">{bycastle[castle].filter((r) => r.result === "승").length}승</span>
                  {" "}
                  <span className="text-red-400">{bycastle[castle].filter((r) => r.result === "패").length}패</span>
                </span>
              </div>
              <div className="space-y-2">
                {bycastle[castle].map((r) => (
                  <RecordCard
                    key={r.id}
                    r={r}
                    isAdmin={isAdmin}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* 성이 지정되지 않은 기록 */}
          {records.filter((r) => !CASTLE_TYPES.includes(r.castle_type)).length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2">기타</p>
              <div className="space-y-2">
                {records
                  .filter((r) => !CASTLE_TYPES.includes(r.castle_type))
                  .map((r) => (
                    <RecordCard key={r.id} r={r} isAdmin={isAdmin} onDelete={() => handleDelete(r.id)} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
