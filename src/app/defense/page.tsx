"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Search, Pencil, Trash2 } from "lucide-react";
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
// 팀 카드
// ────────────────────────────────────────────────
function TeamCard({ team, onRefresh }: { team: DefenseTeam; onRefresh: () => void }) {
  const [addStratOpen, setAddStratOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);

  const strategies: DefenseStrategy[] = (team.strategies ?? []).sort(
    (a, b) => a.strategy_num - b.strategy_num
  );

  async function handleDeleteTeam() {
    if (!confirm(`"${team.title}" 방어팀을 삭제할까요?\n(모든 공략 안도 함께 삭제됩니다)`)) return;
    await createClient().from("defense_teams").delete().eq("id", team.id);
    onRefresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">{team.title}</CardTitle>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {team.hero_names.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
              ))}
            </div>
            {team.formation_slots && team.formation_slots.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1.5">진형 {team.formation_type && `(${team.formation_type})`}</p>
                <FormationPreview slots={team.formation_slots} formationType={team.formation_type ?? "기본"} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditTeamOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              title="팀 수정"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDeleteTeam}
              className="rounded-md p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="팀 삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {strategies.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">등록된 공략 안이 없습니다.</p>
        ) : (
          strategies.map((s) => (
            <StrategyCard key={s.id} strategy={s} onRefresh={onRefresh} />
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
