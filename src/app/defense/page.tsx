"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Search, Pencil, Trash2, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { HeroPicker } from "@/components/ui/HeroPicker";
import { FormationEditor, FormationPreview, arrayToSlots, slotsToArray } from "@/components/ui/FormationEditor";
import type { SlotMap } from "@/components/ui/FormationEditor";
import { searchHeroes } from "@/lib/hero-search";
import type { DefenseTeam, DefenseStrategy, FormationType } from "@/types";

export default function DefensePage() {
  const [teams, setTeams] = useState<DefenseTeam[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [addTeamOpen, setAddTeamOpen] = useState(false);

  async function fetchTeams() {
    const { data } = await createClient()
      .from("defense_teams")
      .select("*, strategies:defense_strategies(*)")
      .eq("team_type", "our")
      .order("display_order");
    setTeams(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchTeams(); }, []);

  // 검색: 팀명 + hero_names (스마트 검색 적용)
  const filtered = query.trim()
    ? teams.filter((t) => {
        const nameMatch = t.title.toLowerCase().includes(query.toLowerCase());
        const heroMatch = t.hero_names.some((h) =>
          searchHeroes([{ name: h }], query).length > 0
        );
        return nameMatch || heroMatch;
      })
    : teams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={22} />
            방어팀 공략
          </h1>
          <p className="text-sm text-muted-foreground mt-1">우리 길드 방어팀 구성과 공략 안을 관리하세요.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddTeamOpen(true)}>
          <Plus size={14} />
          방어팀 추가
        </Button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="영웅 이름 또는 팀명 검색 (예: 브브)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">
          {teams.length === 0 ? "등록된 우리 방어팀이 없습니다." : "검색 결과가 없습니다."}
        </p>
      ) : (
        <div className="grid gap-6">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} onRefresh={fetchTeams} />
          ))}
        </div>
      )}

      <AddTeamDialog
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        onSaved={() => { setAddTeamOpen(false); fetchTeams(); }}
        nextOrder={teams.length + 1}
      />
    </div>
  );
}

// ────────────────────────────────────────────────
// 방어 현황 (상대 공격덱별 승률)
// ────────────────────────────────────────────────
interface DefenseRec {
  id: string;
  team_id: string;
  player_name: string;
  result: "승" | "패";
  opponent_heroes: string[];
  memo: string | null;
  recorded_at: string;
}

interface OpponentGroup {
  key: string;
  heroes: string[];
  wins: number;
  losses: number;
  memos: string[];
}

function groupByOpponent(records: DefenseRec[]): OpponentGroup[] {
  const map: Record<string, OpponentGroup> = {};
  for (const r of records) {
    const heroes = r.opponent_heroes ?? [];
    const key = [...heroes].sort().join(",") || "미입력";
    if (!map[key]) map[key] = { key, heroes, wins: 0, losses: 0, memos: [] };
    if (r.result === "승") map[key].wins++;
    else map[key].losses++;
    if (r.memo) map[key].memos.push(r.memo);
  }
  return Object.values(map).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
}

function AddDefenseRecordDialog({
  teamId, onClose, onSaved,
}: {
  teamId: string; onClose: () => void; onSaved: () => void;
}) {
  const [heroes, setHeroes] = useState<string[]>([]);
  const [result, setResult] = useState<"승" | "패" | null>(null);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!result) { setError("승/패를 선택해주세요."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/defense-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, opponent_heroes: heroes, result, memo: memo || null }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? "저장 실패"); return; }
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <div className="space-y-4">
          <h2 className="text-base font-bold">방어 기록 추가</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">상대 공격덱 영웅 (최대 3명)</label>
            <HeroPicker selected={heroes} onAdd={(n) => { if (heroes.length < 3) setHeroes((p) => [...p, n]); }} onRemove={(n) => setHeroes((p) => p.filter((h) => h !== n))} maxCount={3} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">결과</label>
            <div className="flex gap-2">
              {(["승", "패"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-bold border transition-colors",
                    result === r
                      ? r === "승" ? "bg-blue-500/20 border-blue-500 text-blue-300" : "bg-red-500/20 border-red-500 text-red-300"
                      : "border-border text-muted-foreground hover:bg-accent/30"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">메모 (선택)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="특이사항, 조건 등..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !result}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DefenseStats({ teamId }: { teamId: string }) {
  const [records, setRecords] = useState<DefenseRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  async function fetchRecords() {
    setLoading(true);
    const res = await fetch(`/api/defense-records?team_id=${teamId}`);
    if (res.ok) setRecords(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchRecords(); }, [teamId]);

  async function quickRecord(heroes: string[], result: "승" | "패") {
    const key = heroes.slice().sort().join(",") + result;
    setActing(key);
    await fetch("/api/defense-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, opponent_heroes: heroes, result }),
    });
    setActing(null);
    fetchRecords();
  }

  async function deleteGroup(heroes: string[]) {
    if (!confirm("이 상대덱의 기록을 모두 삭제할까요?")) return;
    const key = heroes.slice().sort().join(",") + "del";
    setActing(key);
    await fetch("/api/defense-records", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, opponent_heroes: heroes }),
    });
    setActing(null);
    fetchRecords();
  }

  const groups = groupByOpponent(records);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/20 transition-colors"
      >
        <Plus size={11} />신규 덱 추가
      </button>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-4">불러오는 중...</p>
      ) : groups.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">기록된 방어전이 없습니다.</p>
      ) : (
        groups.map((g) => {
          const total = g.wins + g.losses;
          const rate = Math.round((g.wins / total) * 100);
          const sortedKey = g.heroes.slice().sort().join(",");
          return (
            <div key={g.key} className="rounded-lg border border-border/40 bg-card/40 px-3 py-2 space-y-1.5">
              {/* 한 줄: 영웅 | 승률 | 버튼 */}
              <div className="flex items-center gap-2">
                {/* 상대 영웅 */}
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {g.heroes.length > 0 ? g.heroes.map((h) => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-900/10 text-red-300 whitespace-nowrap">
                      {h}
                    </span>
                  )) : <span className="text-[10px] text-muted-foreground">미입력</span>}
                </div>
                {/* 승률 */}
                <div className="text-right shrink-0">
                  <span className={cn(
                    "text-xs font-black",
                    rate >= 70 ? "text-green-400" : rate >= 50 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {rate}%
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">{g.wins}승{g.losses}패</span>
                </div>
                {/* 빠른 버튼 */}
                <button
                  onClick={() => quickRecord(g.heroes, "승")}
                  disabled={acting === sortedKey + "승"}
                  className="shrink-0 px-2 py-1 rounded text-[10px] font-bold border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 disabled:opacity-40 transition-colors"
                >
                  {acting === sortedKey + "승" ? "·" : "+승"}
                </button>
                <button
                  onClick={() => quickRecord(g.heroes, "패")}
                  disabled={acting === sortedKey + "패"}
                  className="shrink-0 px-2 py-1 rounded text-[10px] font-bold border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                >
                  {acting === sortedKey + "패" ? "·" : "+패"}
                </button>
                <button
                  onClick={() => deleteGroup(g.heroes)}
                  disabled={acting === sortedKey + "del"}
                  className="shrink-0 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                  title="기록 삭제"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {/* 메모 */}
              {g.memos.length > 0 && (
                <p className="text-[10px] text-muted-foreground pl-0.5 truncate">
                  📝 {g.memos[g.memos.length - 1]}
                </p>
              )}
            </div>
          );
        })
      )}

      {addOpen && (
        <AddDefenseRecordDialog
          teamId={teamId}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); fetchRecords(); }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// 팀 카드
// ────────────────────────────────────────────────
function TeamCard({ team, onRefresh }: { team: DefenseTeam; onRefresh: () => void }) {
  const [addStratOpen, setAddStratOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const strategies: DefenseStrategy[] = (team.strategies ?? []).sort(
    (a, b) => a.strategy_num - b.strategy_num
  );

  async function handleDeleteTeam() {
    if (!confirm(`"${team.title}" 방어팀을 삭제할까요?\n(모든 공략 안도 함께 삭제됩니다)`)) return;
    await createClient().from("defense_teams").delete().eq("id", team.id);
    onRefresh();
  }

  return (
    <Card className="overflow-hidden">
      {/* ① 헤더: 팀명 + 영웅 뱃지 + 수정/삭제 */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/30">
        <div className="min-w-0">
          <p className="text-base font-bold truncate">{team.title}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {team.hero_names.map((name) => (
              <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button onClick={() => setEditTeamOpen(true)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" title="팀 수정">
            <Pencil size={14} />
          </button>
          <button onClick={handleDeleteTeam} className="rounded-md p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="팀 삭제">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ② 중단: 진형 | 방어 현황 (모바일: 세로, 데스크탑: 가로) */}
      <div className="flex flex-col sm:flex-row min-h-0">
        {/* 진형 */}
        {team.formation_slots && team.formation_slots.length > 0 && (
          <div className="sm:w-[240px] sm:shrink-0 sm:border-r sm:border-b-0 border-b border-border/30 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-2">
              진형{team.formation_type ? ` (${team.formation_type})` : ""}
            </p>
            <FormationPreview slots={team.formation_slots} formationType={team.formation_type ?? "기본"} />
          </div>
        )}

        {/* 방어 현황 */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-border/20">
            <BarChart2 size={11} className="text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground">방어 현황</span>
          </div>
          <div className="overflow-y-auto sm:max-h-[260px] px-4 py-2">
            <DefenseStats teamId={team.id} />
          </div>
        </div>
      </div>

      {/* ③ 하단: 공략 안 (전체 폭) */}
      <div className="border-t border-border/30 px-4 py-3 space-y-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
        >
          <span>
            공략 안{" "}
            <span className="font-semibold text-foreground">{strategies.length}개</span>
          </span>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {expanded && (
          <>
            {strategies.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">등록된 공략 안이 없습니다.</p>
            ) : (
              strategies.map((s) => (
                <StrategyCard key={s.id} strategy={s} onRefresh={onRefresh} />
              ))
            )}
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => setAddStratOpen(true)}>
              <Plus size={12} />공략 안 추가
            </Button>
          </>
        )}
      </div>

      <AddStrategyDialog
        open={addStratOpen}
        onClose={() => setAddStratOpen(false)}
        onSaved={() => { setAddStratOpen(false); onRefresh(); }}
        teamId={team.id}
        nextNum={(strategies[strategies.length - 1]?.strategy_num ?? 0) + 1}
      />
      <EditTeamDialog
        open={editTeamOpen}
        team={team}
        onClose={() => setEditTeamOpen(false)}
        onSaved={() => { setEditTeamOpen(false); onRefresh(); }}
      />
    </Card>
  );
}

// ────────────────────────────────────────────────
// 공략 안 카드
// ────────────────────────────────────────────────
function StrategyCard({ strategy: s, onRefresh }: { strategy: DefenseStrategy; onRefresh: () => void }) {
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(`${s.strategy_num}안을 삭제할까요?`)) return;
    await createClient().from("defense_strategies").delete().eq("id", s.id);
    onRefresh();
  }

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-sm font-black text-primary">{s.strategy_num}안</span>
          {s.note && <span className="ml-2 text-sm font-semibold text-foreground">{s.note}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditOpen(true)} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={handleDelete} className="rounded-md p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {(s.main_option || s.stats) && (
        <div className="flex gap-4 text-sm">
          {s.main_option && <InfoItem label="반지 추천" value={s.main_option} />}
          {s.stats && <InfoItem label="속공" value={s.stats} />}
        </div>
      )}

      {s.skill_order && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">스킬순서</p>
          <p className="text-sm whitespace-pre-line leading-relaxed">{s.skill_order}</p>
        </div>
      )}

      {s.equipment && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">장비 세팅</p>
          <p className="text-sm whitespace-pre-line leading-relaxed">{s.equipment}</p>
        </div>
      )}

      {s.memo && (
        <div className="border-t border-border/40 pt-2">
          <p className="text-xs text-muted-foreground mb-0.5">조건/설명/팁</p>
          <p className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">{s.memo}</p>
        </div>
      )}

      <EditStrategyDialog
        open={editOpen}
        strategy={s}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); onRefresh(); }}
      />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

// ────────────────────────────────────────────────
// 상대 방어덱 추가 (팀 추가)
// ────────────────────────────────────────────────
function AddTeamDialog({
  open, onClose, onSaved, nextOrder,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; nextOrder: number;
}) {
  const [title, setTitle] = useState("");
  const [heroes, setHeroes] = useState<string[]>([]);
  const [isAutoTitle, setIsAutoTitle] = useState(true);
  const [formationType, setFormationType] = useState<FormationType>("기본");
  const [slotMap, setSlotMap] = useState<SlotMap>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() { setTitle(""); setHeroes([]); setIsAutoTitle(true); setFormationType("기본"); setSlotMap({}); setError(""); }

  function handleAdd(name: string) {
    if (heroes.length >= 3) return;
    const next = [...heroes, name];
    setHeroes(next);
    if (isAutoTitle) setTitle(next.join(" "));
  }

  function handleRemove(name: string) {
    const next = heroes.filter((h) => h !== name);
    setHeroes(next);
    if (isAutoTitle) setTitle(next.join(" "));
    setSlotMap((prev) => {
      const updated = { ...prev };
      for (const pos of Object.keys(updated)) {
        if (updated[Number(pos)] === name) delete updated[Number(pos)];
      }
      return updated;
    });
  }

  async function handleSave() {
    if (!title.trim()) { setError("팀 이름을 입력하세요."); return; }
    if (heroes.length === 0) { setError("영웅을 최소 1명 선택하세요."); return; }
    setSaving(true);
    const { error: err } = await createClient()
      .from("defense_teams")
      .insert({ title: title.trim(), hero_names: heroes, display_order: nextOrder, team_type: "our", formation_type: formationType, formation_slots: slotsToArray(slotMap) });
    setSaving(false);
    if (err) { setError(err.message); return; }
    reset(); onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">우리 방어팀 추가</h2>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">팀 이름 *</label>
            <Input
              placeholder="영웅 선택 시 자동 입력"
              value={title}
              onChange={(e) => { setIsAutoTitle(false); setTitle(e.target.value); }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">영웅 선택 * (최대 3명)</label>
            <HeroPicker
              selected={heroes}
              onAdd={handleAdd}
              onRemove={handleRemove}
              maxCount={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">진형 설정 (선택한 영웅만 배치 가능)</label>
            <FormationEditor
              formationType={formationType}
              onFormationTypeChange={setFormationType}
              slots={slotMap}
              onSlotsChange={setSlotMap}
              allowedHeroes={heroes}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>취소</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────
// 팀 수정
// ────────────────────────────────────────────────
function EditTeamDialog({
  open, team, onClose, onSaved,
}: {
  open: boolean; team: DefenseTeam; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(team.title);
  const [heroes, setHeroes] = useState<string[]>(team.hero_names);
  const [formationType, setFormationType] = useState<FormationType>(team.formation_type ?? "기본");
  const [slotMap, setSlotMap] = useState<SlotMap>(() => arrayToSlots(team.formation_slots));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleEditRemove(name: string) {
    setHeroes((p) => p.filter((h) => h !== name));
    setSlotMap((prev) => {
      const updated = { ...prev };
      for (const pos of Object.keys(updated)) {
        if (updated[Number(pos)] === name) delete updated[Number(pos)];
      }
      return updated;
    });
  }

  async function handleSave() {
    if (!title.trim()) { setError("팀 이름을 입력하세요."); return; }
    if (heroes.length === 0) { setError("영웅을 최소 1명 선택하세요."); return; }
    setSaving(true);
    const { error: err } = await createClient()
      .from("defense_teams")
      .update({ title: title.trim(), hero_names: heroes, formation_type: formationType, formation_slots: slotsToArray(slotMap) })
      .eq("id", team.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">방어팀 수정</h2>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">팀 이름 *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">영웅 선택 * (최대 3명)</label>
            <HeroPicker
              selected={heroes}
              onAdd={(name) => { if (heroes.length < 3) setHeroes((p) => [...p, name]); }}
              onRemove={handleEditRemove}
              maxCount={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">진형 설정 (선택한 영웅만 배치 가능)</label>
            <FormationEditor
              formationType={formationType}
              onFormationTypeChange={setFormationType}
              slots={slotMap}
              onSlotsChange={setSlotMap}
              allowedHeroes={heroes}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────
// 공략 안 추가 / 수정 공통 폼
// 필드: 케이스이름(note), 반지추천(main_option), 속공(stats),
//       스킬순서(skill_order), 장비세팅(equipment), 조건/설명/팁(memo)
// ────────────────────────────────────────────────
type StrategyForm = {
  case_name: string;   // → note
  ring_rec: string;    // → main_option
  speed: string;       // → stats
  skill_order: string; // → skill_order
  equipment: string;   // → equipment
  conditions: string;  // → memo
};
const EMPTY_FORM: StrategyForm = {
  case_name: "", ring_rec: "", speed: "", skill_order: "", equipment: "", conditions: "",
};

const TEXT_AREA_CLS = cn(
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
);

function StrategyFormDialog({
  open, title, initialForm, onClose, onSave,
}: {
  open: boolean;
  title: string;
  initialForm: StrategyForm;
  onClose: () => void;
  onSave: (form: StrategyForm) => Promise<void>;
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm(initialForm); }, [open]);

  const set = (key: keyof StrategyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="space-y-3">
          <h2 className="text-lg font-bold">{title}</h2>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">케이스 이름</label>
            <Input value={form.case_name} onChange={set("case_name")} placeholder="예) 조건1 - 전부 6초 이상" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">반지 추천</label>
              <Input value={form.ring_rec} onChange={set("ring_rec")} placeholder="예) 공격반지" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">속공</label>
              <Input value={form.speed} onChange={set("speed")} placeholder="예) 130~170" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">스킬순서</label>
            <textarea
              value={form.skill_order}
              onChange={set("skill_order")}
              rows={3}
              className={TEXT_AREA_CLS}
              placeholder="예) 1. 여포1 파이2 여포2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">장비 세팅</label>
            <textarea
              value={form.equipment}
              onChange={set("equipment")}
              rows={2}
              className={TEXT_AREA_CLS}
              placeholder="예) 전부 추적자 or 암살자 내실세팅"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">조건/설명/팁</label>
            <textarea
              value={form.conditions}
              onChange={set("conditions")}
              rows={3}
              className={TEXT_AREA_CLS}
              placeholder="추가 조건이나 주의사항..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddStrategyDialog({
  open, onClose, onSaved, teamId, nextNum,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; teamId: string; nextNum: number;
}) {
  return (
    <StrategyFormDialog
      open={open}
      title={`${nextNum}안 추가`}
      initialForm={EMPTY_FORM}
      onClose={onClose}
      onSave={async (form) => {
        const { error } = await createClient().from("defense_strategies").insert({
          team_id: teamId,
          strategy_num: nextNum,
          note: form.case_name || null,
          main_option: form.ring_rec || null,
          stats: form.speed || null,
          skill_order: form.skill_order || null,
          equipment: form.equipment || null,
          memo: form.conditions || null,
        });
        if (!error) onSaved();
      }}
    />
  );
}

function EditStrategyDialog({
  open, strategy: s, onClose, onSaved,
}: {
  open: boolean; strategy: DefenseStrategy; onClose: () => void; onSaved: () => void;
}) {
  return (
    <StrategyFormDialog
      open={open}
      title={`${s.strategy_num}안 수정`}
      initialForm={{
        case_name: s.note ?? "",
        ring_rec: s.main_option ?? "",
        speed: s.stats ?? "",
        skill_order: s.skill_order ?? "",
        equipment: s.equipment ?? "",
        conditions: s.memo ?? "",
      }}
      onClose={onClose}
      onSave={async (form) => {
        const { error } = await createClient().from("defense_strategies").update({
          note: form.case_name || null,
          main_option: form.ring_rec || null,
          stats: form.speed || null,
          skill_order: form.skill_order || null,
          equipment: form.equipment || null,
          memo: form.conditions || null,
        }).eq("id", s.id);
        if (!error) onSaved();
      }}
    />
  );
}
