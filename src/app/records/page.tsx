"use client";

import { useState, useEffect } from "react";
import { Trophy, Swords, Shield, RefreshCw, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ── 타입 ──────────────────────────────────────────
interface AttackRecord {
  id: string;
  player_name: string;
  result: "승" | "패";
  note: string | null;
  castle_type: string | null;
  opponent_name: string | null;
  recorded_at: string;
  attack_decks: { name: string } | null;
}

interface DefenseRecord {
  id: string;
  player_name: string;
  result: "승" | "패";
  memo: string | null;
  recorded_at: string;
  defense_teams: { title: string } | null;
}

interface Rank {
  player_name: string;
  wins: number;
  losses: number;
  rate: number;
}

function calcRanks(records: { player_name: string; result: string }[]): Rank[] {
  const map: Record<string, { wins: number; losses: number }> = {};
  for (const r of records) {
    if (!map[r.player_name]) map[r.player_name] = { wins: 0, losses: 0 };
    if (r.result === "승") map[r.player_name].wins++;
    else map[r.player_name].losses++;
  }
  return Object.entries(map)
    .map(([player_name, { wins, losses }]) => {
      const total = wins + losses;
      return { player_name, wins, losses, rate: total === 0 ? 0 : Math.round((wins / total) * 100) };
    })
    .sort((a, b) => b.rate - a.rate || (b.wins + b.losses) - (a.wins + a.losses));
}

const MEDAL = ["🥇", "🥈", "🥉"];

function RankTable({ ranks }: { ranks: Rank[] }) {
  if (ranks.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">기록이 없습니다.</p>;
  }
  return (
    <div className="space-y-2">
      {ranks.map((r, i) => (
        <div key={r.player_name} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/20 border border-border/40">
          <span className="text-lg w-7 text-center shrink-0">
            {i < 3 ? MEDAL[i] : <span className="text-sm text-muted-foreground font-bold">{i + 1}</span>}
          </span>
          <span className="flex-1 font-semibold">{r.player_name}</span>
          <span className="text-xs text-muted-foreground">{r.wins}승 {r.losses}패</span>
          <span className={cn(
            "text-base font-black w-14 text-right",
            r.rate >= 70 ? "text-green-400" : r.rate >= 50 ? "text-yellow-400" : "text-red-400"
          )}>
            {r.rate}%
          </span>
        </div>
      ))}
    </div>
  );
}

function TodayTab({ records }: { records: AttackRecord[] }) {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const todayRecords = records.filter((r) => {
    const d = new Date(r.recorded_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
    return d === today;
  });

  if (todayRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <Calendar size={32} className="opacity-30" />
        <p className="text-sm">오늘 기록된 공격이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground px-1">
        오늘 총 <span className="text-foreground font-semibold">{todayRecords.length}</span>번 공격
        &nbsp;·&nbsp;
        <span className="text-blue-400 font-semibold">{todayRecords.filter(r => r.result === "승").length}승</span>
        &nbsp;
        <span className="text-red-400 font-semibold">{todayRecords.filter(r => r.result === "패").length}패</span>
      </p>
      {todayRecords.map((r) => (
        <div key={r.id} className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border/40 bg-card text-sm">
          <Badge
            variant="outline"
            className={r.result === "승"
              ? "border-blue-500 text-blue-400 shrink-0"
              : "border-red-500 text-red-400 shrink-0"}
          >
            {r.result}
          </Badge>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{r.player_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {r.attack_decks?.name ?? "삭제된 덱"}
            </p>
            {(r.castle_type || r.opponent_name) && (
              <p className="text-xs text-amber-400 mt-0.5">
                {r.castle_type && `🏰 ${r.castle_type}`}
                {r.castle_type && r.opponent_name && " · "}
                {r.opponent_name && `🎭 ${r.opponent_name}`}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(r.recorded_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────
export default function RecordsPage() {
  const [attackRecords, setAttackRecords] = useState<AttackRecord[]>([]);
  const [defenseRecords, setDefenseRecords] = useState<DefenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    setLoading(true);
    const db = createClient();
    const [{ data: atk }, { data: def }] = await Promise.all([
      db.from("guild_war_records")
        .select("id, player_name, result, note, castle_type, opponent_name, recorded_at, attack_decks(name)")
        .order("recorded_at", { ascending: false }),
      db.from("defense_records")
        .select("id, player_name, result, memo, recorded_at, defense_teams(title)")
        .order("recorded_at", { ascending: false }),
    ]);
    setAttackRecords((atk ?? []) as unknown as AttackRecord[]);
    setDefenseRecords((def ?? []) as unknown as DefenseRecord[]);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const attackRanks = calcRanks(attackRecords);
  const defenseRanks = calcRanks(defenseRecords);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy size={22} />
          랭킹
        </h1>
        <button
          onClick={fetchAll}
          className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">불러오는 중...</p>
      ) : (
        <Tabs defaultValue="today">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="today" className="gap-1.5">
              <Calendar size={13} />오늘의 길드전
            </TabsTrigger>
            <TabsTrigger value="attack" className="gap-1.5">
              <Swords size={13} />공격 랭킹
            </TabsTrigger>
            <TabsTrigger value="defense" className="gap-1.5">
              <Shield size={13} />수비 랭킹
            </TabsTrigger>
          </TabsList>

          {/* ── 오늘의 길드전 탭 ── */}
          <TabsContent value="today" className="mt-4">
            <TodayTab records={attackRecords} />
          </TabsContent>

          {/* ── 공격 탭 ── */}
          <TabsContent value="attack" className="mt-4 space-y-5">
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <p className="text-sm font-semibold">공격 승률 순위</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <RankTable ranks={attackRanks} />
              </CardContent>
            </Card>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">최근 공격 기록</p>
              {attackRecords.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">기록이 없습니다.</p>
              ) : (
                attackRecords.slice(0, 30).map((r) => (
                  <div key={r.id} className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border/40 bg-card text-sm">
                    <Badge
                      variant="outline"
                      className={r.result === "승"
                        ? "border-blue-500 text-blue-400 shrink-0"
                        : "border-red-500 text-red-400 shrink-0"}
                    >
                      {r.result}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{r.player_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.attack_decks?.name ?? "삭제된 덱"}
                      </p>
                      {r.note && (
                        <p className="text-xs text-amber-400 mt-0.5">⚡ {r.note}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(r.recorded_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── 수비 탭 ── */}
          <TabsContent value="defense" className="mt-4 space-y-5">
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <p className="text-sm font-semibold">수비 승률 순위</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <RankTable ranks={defenseRanks} />
              </CardContent>
            </Card>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">최근 수비 기록</p>
              {defenseRecords.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">기록이 없습니다.</p>
              ) : (
                defenseRecords.slice(0, 30).map((r) => (
                  <div key={r.id} className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border/40 bg-card text-sm">
                    <Badge
                      variant="outline"
                      className={r.result === "승"
                        ? "border-blue-500 text-blue-400 shrink-0"
                        : "border-red-500 text-red-400 shrink-0"}
                    >
                      {r.result}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{r.player_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.defense_teams?.title ?? "삭제된 팀"}
                      </p>
                      {r.memo && (
                        <p className="text-xs text-muted-foreground mt-0.5">📝 {r.memo}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(r.recorded_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
