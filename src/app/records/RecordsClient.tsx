"use client";

import { useState, useEffect } from "react";
import { Trophy, Swords, Shield, RefreshCw, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
  team_id: string;
  player_name: string;
  defender_name: string | null;
  result: "승" | "패";
  memo: string | null;
  recorded_at: string;
  defense_teams: { title: string } | null;
}

interface AttackRank {
  player_name: string;
  wins: number;
  losses: number;
  rate: number;
}

interface BlockRank {
  name: string;
  blocks: number;
  losses: number;
  total: number;
  rate: number;
  teams: { title: string; count: number }[];
}

function calcAttackRanks(records: { player_name: string; result: string }[]): AttackRank[] {
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

function calcBlockRanks(records: DefenseRecord[]): BlockRank[] {
  const map: Record<string, { blocks: number; losses: number; teams: Record<string, number> }> = {};
  for (const r of records) {
    const name = r.defender_name;
    if (!name) continue;
    if (!map[name]) map[name] = { blocks: 0, losses: 0, teams: {} };
    if (r.result === "승") {
      map[name].blocks++;
      const teamTitle = r.defense_teams?.title ?? "알 수 없음";
      map[name].teams[teamTitle] = (map[name].teams[teamTitle] ?? 0) + 1;
    } else {
      map[name].losses++;
    }
  }
  return Object.entries(map)
    .map(([name, { blocks, losses, teams }]) => {
      const total = blocks + losses;
      return {
        name,
        blocks,
        losses,
        total,
        rate: total === 0 ? 0 : Math.round((blocks / total) * 100),
        teams: Object.entries(teams)
          .map(([title, count]) => ({ title, count }))
          .sort((a, b) => b.count - a.count),
      };
    })
    .sort((a, b) => b.blocks - a.blocks || b.total - a.total);
}

const MEDAL = ["🥇", "🥈", "🥉"];

function AttackRankTable({ ranks }: { ranks: AttackRank[] }) {
  if (ranks.length === 0) return <p className="text-center text-sm text-muted-foreground py-8">기록이 없습니다.</p>;
  return (
    <div className="space-y-2">
      {ranks.map((r, i) => (
        <div key={r.player_name} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/20 border border-border/40">
          <span className="text-lg w-7 text-center shrink-0">
            {i < 3 ? MEDAL[i] : <span className="text-sm text-muted-foreground font-bold">{i + 1}</span>}
          </span>
          <span className="flex-1 font-semibold">{r.player_name}</span>
          <span className="text-xs text-muted-foreground">{r.wins}승 {r.losses}패</span>
          <span className={cn("text-base font-black w-14 text-right", r.rate >= 70 ? "text-green-400" : r.rate >= 50 ? "text-yellow-400" : "text-red-400")}>
            {r.rate}%
          </span>
        </div>
      ))}
    </div>
  );
}

function BlockRankTable({ ranks }: { ranks: BlockRank[] }) {
  if (ranks.length === 0) {
    return (
      <div className="text-center py-8 space-y-1">
        <p className="text-sm text-muted-foreground">수비 블록 기록이 없습니다.</p>
        <p className="text-xs text-muted-foreground/60">방어 기록 추가 시 &quot;누가 막았나요?&quot;를 등록하면 반영됩니다.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {ranks.map((r, i) => (
        <div key={r.name} className="rounded-lg bg-muted/20 border border-border/40 px-4 py-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-lg w-7 text-center shrink-0">
              {i < 3 ? MEDAL[i] : <span className="text-sm text-muted-foreground font-bold">{i + 1}</span>}
            </span>
            <span className="flex-1 font-semibold">{r.name}</span>
            <span className="text-xs text-muted-foreground">{r.blocks}막 / {r.total}전</span>
            <span className={cn("text-base font-black w-14 text-right", r.rate >= 70 ? "text-green-400" : r.rate >= 50 ? "text-yellow-400" : "text-red-400")}>
              {r.rate}%
            </span>
          </div>
          {r.teams.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-10">
              {r.teams.map((t) => (
                <span
                  key={t.title}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300"
                >
                  {t.title} {t.count}회
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


export default function RecordsClient({ isAdmin }: { isAdmin: boolean }) {
  const [attackRecords, setAttackRecords] = useState<AttackRecord[]>([]);
  const [defenseRecords, setDefenseRecords] = useState<DefenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    setLoading(true);
    const db = createClient();
    const [{ data: atk }, { data: def }] = await Promise.all([
      db.from("guild_war_records").select("id, player_name, result, note, castle_type, opponent_name, recorded_at, attack_decks(name)").order("recorded_at", { ascending: false }),
      db.from("defense_records").select("id, team_id, player_name, defender_name, result, memo, recorded_at, defense_teams(title)").order("recorded_at", { ascending: false }),
    ]);
    setAttackRecords((atk ?? []) as unknown as AttackRecord[]);
    setDefenseRecords((def ?? []) as unknown as DefenseRecord[]);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function deleteAttackRecord(id: string) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await fetch(`/api/admin/records/attack/${id}`, { method: "DELETE" });
    await fetchAll();
  }

  async function resetAttackRecords() {
    if (!confirm("공격 기록을 전부 초기화할까요?")) return;
    await fetch("/api/admin/records/attack", { method: "DELETE" });
    await fetchAll();
  }

  async function deleteDefenseRecord(id: string) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await fetch(`/api/admin/records/defense/${id}`, { method: "DELETE" });
    await fetchAll();
  }

  async function resetDefenseRecords() {
    if (!confirm("수비 기록을 전부 초기화할까요?")) return;
    await fetch("/api/admin/records/defense", { method: "DELETE" });
    await fetchAll();
  }

  const attackRanks = calcAttackRanks(attackRecords);
  const blockRanks = calcBlockRanks(defenseRecords);

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
        <Tabs defaultValue="attack">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="attack" className="gap-1.5"><Swords size={13} />공격 랭킹</TabsTrigger>
            <TabsTrigger value="defense" className="gap-1.5"><Shield size={13} />수비 랭킹</TabsTrigger>
          </TabsList>

          {/* ── 공격 랭킹 ── */}
          <TabsContent value="attack" className="mt-4 space-y-5">
            <Card>
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between">
                <p className="text-sm font-semibold">공격 승률 순위</p>
                {isAdmin && (
                  <button
                    onClick={resetAttackRecords}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-500/40 rounded-lg px-2 py-1 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={11} />전체 초기화
                  </button>
                )}
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <AttackRankTable ranks={attackRanks} />
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
                      className={r.result === "승" ? "border-blue-500 text-blue-400 shrink-0" : "border-red-500 text-red-400 shrink-0"}
                    >
                      {r.result}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{r.player_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.attack_decks?.name ?? "삭제된 덱"}</p>
                      {r.note && <p className="text-xs text-amber-400 mt-0.5">⚡ {r.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.recorded_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </span>
                      {isAdmin && (
                        <button onClick={() => deleteAttackRecord(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── 수비 랭킹 ── */}
          <TabsContent value="defense" className="mt-4 space-y-5">
            <Card>
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">수비 블록 랭킹</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">수비자가 등록된 기록만 집계 · 막은 횟수 순</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={resetDefenseRecords}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-500/40 rounded-lg px-2 py-1 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={11} />전체 초기화
                  </button>
                )}
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <BlockRankTable ranks={blockRanks} />
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
                      className={r.result === "승" ? "border-blue-500 text-blue-400 shrink-0" : "border-red-500 text-red-400 shrink-0"}
                    >
                      {r.result}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{r.defense_teams?.title ?? "삭제된 팀"}</p>
                      {r.defender_name && (
                        <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                          <User size={10} />
                          {r.defender_name}
                        </p>
                      )}
                      {r.memo && <p className="text-xs text-muted-foreground mt-0.5">📝 {r.memo}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.recorded_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </span>
                      {isAdmin && (
                        <button onClick={() => deleteDefenseRecord(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
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
