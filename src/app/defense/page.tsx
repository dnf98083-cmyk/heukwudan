"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { DefenseTeam, DefenseStrategy } from "@/types";

export default function DefensePage() {
  const [teams, setTeams] = useState<DefenseTeam[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [addTeamOpen, setAddTeamOpen] = useState(false);

  async function fetchTeams() {
    const { data } = await createClient()
      .from("defense_teams")
      .select("*, strategies:defense_strategies(*)")
      .order("display_order");
    setTeams(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchTeams(); }, []);

  const filtered = teams.filter(
    (t) =>
      t.title.includes(query) ||
      t.hero_names.some((h) => h.includes(query))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={22} />
            방어팀 공략
          </h1>
          <p className="text-sm text-muted-foreground mt-1">방어팀 구성별 공략 안을 확인하세요.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddTeamOpen(true)}>
          <Plus size={14} />
          팀 추가
        </Button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="영웅 이름 또는 팀명 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">
          {teams.length === 0 ? "등록된 방어팀이 없습니다." : "검색 결과가 없습니다."}
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
// 팀 카드
// ────────────────────────────────────────────────
function TeamCard({ team, onRefresh }: { team: DefenseTeam; onRefresh: () => void }) {
  const [addStratOpen, setAddStratOpen] = useState(false);
  const strategies: DefenseStrategy[] = (team.strategies ?? []).sort(
    (a, b) => a.strategy_num - b.strategy_num
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{team.title}</CardTitle>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {team.hero_names.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {strategies.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">등록된 공략 안이 없습니다.</p>
        ) : (
          strategies.map((s) => (
            <StrategyCard key={s.id} strategy={s} />
          ))
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => setAddStratOpen(true)}
        >
          <Plus size={12} />공략 안 추가
        </Button>
      </CardContent>

      <AddStrategyDialog
        open={addStratOpen}
        onClose={() => setAddStratOpen(false)}
        onSaved={() => { setAddStratOpen(false); onRefresh(); }}
        teamId={team.id}
        nextNum={(strategies[strategies.length - 1]?.strategy_num ?? 0) + 1}
      />
    </Card>
  );
}

function StrategyCard({ strategy: s }: { strategy: DefenseStrategy }) {
  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">{s.strategy_num}안</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
        <InfoItem label="장비" value={s.equipment} />
        <InfoItem label="메인옵" value={s.main_option} />
        <InfoItem label="스탯" value={s.stats} />
        <InfoItem label="특이사항" value={s.note} />
      </div>
      {s.memo && (
        <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">📝 {s.memo}</p>
      )}
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
// 방어팀 추가 다이얼로그
// ────────────────────────────────────────────────
function AddTeamDialog({
  open, onClose, onSaved, nextOrder,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  nextOrder: number;
}) {
  const [title, setTitle] = useState("");
  const [heroInput, setHeroInput] = useState("");
  const [heroes, setHeroes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTitle(""); setHeroInput(""); setHeroes([]); setError("");
  }

  function addHero() {
    const name = heroInput.trim();
    if (!name || heroes.includes(name)) return;
    setHeroes((prev) => [...prev, name]);
    setHeroInput("");
  }

  async function handleSave() {
    if (!title.trim()) { setError("팀 이름을 입력하세요."); return; }
    if (heroes.length === 0) { setError("영웅을 최소 1명 추가하세요."); return; }
    setSaving(true);
    const { error: err } = await createClient()
      .from("defense_teams")
      .insert({ title: title.trim(), hero_names: heroes, display_order: nextOrder });
    setSaving(false);
    if (err) { setError(err.message); return; }
    reset();
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">방어팀 추가</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">팀 이름 *</label>
            <Input
              placeholder="예: 여포 브브 칼헬론"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">영웅 추가 *</label>
            <div className="flex gap-2">
              <Input
                placeholder="영웅 이름 입력"
                value={heroInput}
                onChange={(e) => setHeroInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHero()}
              />
              <Button size="sm" variant="outline" onClick={addHero}>추가</Button>
            </div>
            {heroes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {heroes.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium"
                  >
                    {name}
                    <button onClick={() => setHeroes((p) => p.filter((h) => h !== name))}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
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
// 공략 안 추가 다이얼로그
// ────────────────────────────────────────────────
function AddStrategyDialog({
  open, onClose, onSaved, teamId, nextNum,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teamId: string;
  nextNum: number;
}) {
  const [form, setForm] = useState({ equipment: "", main_option: "", stats: "", note: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() { setForm({ equipment: "", main_option: "", stats: "", note: "", memo: "" }); setError(""); }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    const { error: err } = await createClient()
      .from("defense_strategies")
      .insert({
        team_id: teamId,
        strategy_num: nextNum,
        equipment: form.equipment || null,
        main_option: form.main_option || null,
        stats: form.stats || null,
        note: form.note || null,
        memo: form.memo || null,
      });
    setSaving(false);
    if (err) { setError(err.message); return; }
    reset();
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{nextNum}안 추가</h2>

          <div className="grid grid-cols-2 gap-3">
            {(["equipment", "main_option", "stats", "note"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {{ equipment: "장비", main_option: "메인옵", stats: "스탯", note: "특이사항" }[key]}
                </label>
                <Input value={form[key]} onChange={set(key)} />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">메모</label>
            <textarea
              value={form.memo}
              onChange={set("memo")}
              rows={2}
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              )}
              placeholder="추가 메모..."
            />
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
