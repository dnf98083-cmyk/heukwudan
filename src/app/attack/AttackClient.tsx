"use client";

import { useState, useEffect } from "react";
import { Swords, ChevronDown, Trophy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { AttackDeck, FormationType, SpeedType } from "@/types";

interface Props {
  initialTeams: { id: string; title: string }[];
  playerNickname: string;
}

type SortKey = "winrate" | "usage" | "recent" | "games";

const SORT_LABELS: Record<SortKey, string> = {
  winrate: "승률순",
  usage: "사용횟수",
  recent: "최근사용",
  games: "전적순",
};

const FORMATION_COLOR: Record<FormationType, string> = {
  기본: "bg-muted text-muted-foreground",
  밸런스: "bg-green-500/20 text-green-400",
  공격: "bg-red-500/20 text-red-400",
  보호: "bg-blue-500/20 text-blue-400",
};

function winRate(deck: AttackDeck) {
  const total = deck.wins + deck.losses;
  return total === 0 ? 0 : Math.round((deck.wins / total) * 100);
}

function sortDecks(decks: AttackDeck[], key: SortKey) {
  return [...decks].sort((a, b) => {
    if (key === "winrate") return winRate(b) - winRate(a);
    if (key === "usage" || key === "games") return (b.wins + b.losses) - (a.wins + a.losses);
    if (key === "recent") return (b.last_used_at ?? "").localeCompare(a.last_used_at ?? "");
    return 0;
  });
}

export default function AttackClient({ initialTeams, playerNickname }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("winrate");
  const [decks, setDecks] = useState<AttackDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<AttackDeck | null>(null);
  const [addDeckOpen, setAddDeckOpen] = useState(false);

  const filteredTeams = initialTeams.filter((t) => t.title.includes(search));
  const selectedTeam = initialTeams.find((t) => t.id === selectedTeamId);

  // 팀 선택 시 해당 팀의 공격덱 로드
  useEffect(() => {
    if (!selectedTeamId) {
      setDecks([]);
      return;
    }
    setLoadingDecks(true);
    createClient()
      .from("attack_decks")
      .select("*")
      .eq("defense_team_id", selectedTeamId)
      .then(({ data }) => {
        setDecks(data ?? []);
        setLoadingDecks(false);
      });
  }, [selectedTeamId]);

  async function recordResult(deckId: string, result: "승" | "패") {
    await createClient().rpc("record_attack_result", {
      p_deck_id: deckId,
      p_result: result,
      p_player: playerNickname,
    });
    // 기록 후 덱 목록 새로고침
    if (selectedTeamId) {
      const { data } = await createClient()
        .from("attack_decks")
        .select("*")
        .eq("defense_team_id", selectedTeamId);
      setDecks(data ?? []);
    }
  }

  const sortedDecks = sortDecks(decks, sort);
  const ranking = sortDecks(decks, "winrate").slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Swords size={22} />
          길드전 공격기록
        </h1>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!selectedTeamId}
          onClick={() => setAddDeckOpen(true)}
        >
          <Plus size={14} />
          공격덱 추가
        </Button>
      </div>

      {/* 방어팀 선택 드롭다운 */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card text-sm font-medium hover:bg-accent/30 transition-colors"
        >
          <span className={selectedTeam ? "text-foreground" : "text-muted-foreground"}>
            {selectedTeam ? selectedTeam.title : "🛡️ 방어팀을 선택하세요"}
          </span>
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-xl">
            <div className="p-2">
              <Input
                placeholder="검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2"
                autoFocus
              />
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {filteredTeams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTeamId(t.id); setDropdownOpen(false); setSearch(""); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      selectedTeamId === t.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                  >
                    {t.title}
                  </button>
                ))}
                {filteredTeams.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">검색 결과 없음</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 정렬 버튼 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors",
              sort === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent/30"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 공격덱 목록 */}
      {!selectedTeamId ? (
        <p className="text-center text-muted-foreground text-sm py-12">
          위에서 방어팀을 선택하면 공략이 표시됩니다.
        </p>
      ) : loadingDecks ? (
        <p className="text-center text-muted-foreground text-sm py-12">불러오는 중...</p>
      ) : sortedDecks.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">등록된 공격덱이 없습니다.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedDecks.map((deck) => {
            const rate = winRate(deck);
            return (
              <button key={deck.id} onClick={() => setSelectedDeck(deck)} className="text-left">
                <Card className="hover:bg-accent/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{deck.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{deck.created_by}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn(
                          "text-lg font-black",
                          rate >= 70 ? "text-green-400" : rate >= 50 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {rate}%
                        </div>
                        <div className="text-xs text-muted-foreground">{deck.wins}승 {deck.losses}패</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 flex flex-wrap gap-1.5">
                    {deck.speed_type && (
                      <Badge variant="outline" className={deck.speed_type === "속공 따야 함" ? "border-yellow-500 text-yellow-400 text-xs" : "text-xs"}>
                        ⚡ {deck.speed_type}
                      </Badge>
                    )}
                    {deck.formation_type && (
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", FORMATION_COLOR[deck.formation_type])}>
                        {deck.formation_type}
                      </span>
                    )}
                    {deck.ring && <span className="text-xs text-muted-foreground">💍 {deck.ring}</span>}
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* 시즌 랭킹 */}
      {ranking.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Trophy size={15} className="text-yellow-400" />
              이 방어팀 랭킹
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {ranking.map((deck, i) => (
              <div key={deck.id} className="flex items-center gap-3 text-sm">
                <span className={cn(
                  "w-5 text-center font-black shrink-0",
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                )}>
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{deck.name}</span>
                <span className={cn("font-bold shrink-0", winRate(deck) >= 70 ? "text-green-400" : "text-muted-foreground")}>
                  {winRate(deck)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DeckDialog
        deck={selectedDeck}
        onClose={() => setSelectedDeck(null)}
        onRecord={recordResult}
      />

      {selectedTeamId && (
        <AddDeckDialog
          open={addDeckOpen}
          onClose={() => setAddDeckOpen(false)}
          onSaved={() => {
            setAddDeckOpen(false);
            // 저장 후 덱 목록 새로고침
            createClient()
              .from("attack_decks")
              .select("*")
              .eq("defense_team_id", selectedTeamId)
              .then(({ data }) => setDecks(data ?? []));
          }}
          teamId={selectedTeamId}
          playerNickname={playerNickname}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// 공격덱 추가 다이얼로그
// ────────────────────────────────────────────────
const SPEED_TYPES: SpeedType[] = ["속공 따야 함", "내줘도 됨"];
const FORMATION_TYPES: FormationType[] = ["기본", "밸런스", "공격", "보호"];

function AddDeckDialog({
  open, onClose, onSaved, teamId, playerNickname,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teamId: string;
  playerNickname: string;
}) {
  const empty = {
    name: "", speed_type: "" as SpeedType | "",
    ring: "", pet: "",
    formation_type: "" as FormationType | "",
    formation: "", skill_order: "", equipment: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() { setForm(empty); setError(""); }
  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  async function handleSave() {
    if (!form.name.trim()) { setError("덱 이름을 입력하세요."); return; }
    setSaving(true);
    const { error: err } = await createClient()
      .from("attack_decks")
      .insert({
        defense_team_id: teamId,
        name: form.name.trim(),
        speed_type: form.speed_type || null,
        ring: form.ring || null,
        pet: form.pet || null,
        formation_type: form.formation_type || null,
        formation: form.formation || null,
        skill_order: form.skill_order || null,
        equipment: form.equipment || null,
        created_by: playerNickname,
      });
    setSaving(false);
    if (err) { setError(err.message); return; }
    reset();
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">공격덱 추가</h2>

          <Field label="덱 이름 *">
            <Input placeholder="예: 브브 여포 풍연" value={form.name} onChange={set("name")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="속공">
              <select value={form.speed_type} onChange={set("speed_type")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">선택 안 함</option>
                {SPEED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="진형">
              <select value={form.formation_type} onChange={set("formation_type")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">선택 안 함</option>
                {FORMATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="반지">
              <Input placeholder="반지 이름" value={form.ring} onChange={set("ring")} />
            </Field>
            <Field label="펫">
              <Input placeholder="펫 이름" value={form.pet} onChange={set("pet")} />
            </Field>
          </div>

          <Field label="진형 구성 (캐릭터 순서)">
            <Input placeholder="예: 브브 여포 풍연" value={form.formation} onChange={set("formation")} />
          </Field>
          <Field label="스킬 순서">
            <Input placeholder="예: 브브 → 여포 → 풍연" value={form.skill_order} onChange={set("skill_order")} />
          </Field>
          <Field label="장비 / 특이사항">
            <Input placeholder="예: 공격력 위주 세팅" value={form.equipment} onChange={set("equipment")} />
          </Field>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function DeckDialog({
  deck,
  onClose,
  onRecord,
}: {
  deck: AttackDeck | null;
  onClose: () => void;
  onRecord: (deckId: string, result: "승" | "패") => Promise<void>;
}) {
  const [recording, setRecording] = useState(false);

  async function handleResult(result: "승" | "패") {
    if (!deck) return;
    setRecording(true);
    await onRecord(deck.id, result);
    setRecording(false);
    onClose();
  }

  if (!deck) return null;
  const rate = winRate(deck);

  return (
    <Dialog open={!!deck} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{deck.name}</h2>
              <p className="text-xs text-muted-foreground">{deck.created_by}</p>
            </div>
            <div className="text-right shrink-0">
              <div className={cn("text-2xl font-black", rate >= 70 ? "text-green-400" : rate >= 50 ? "text-yellow-400" : "text-red-400")}>
                {rate}%
              </div>
              <div className="text-xs text-muted-foreground">{deck.wins}승 {deck.losses}패</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {deck.speed_type && (
              <Badge variant="outline" className={deck.speed_type === "속공 따야 함" ? "border-yellow-500 text-yellow-400" : ""}>
                ⚡ {deck.speed_type}
              </Badge>
            )}
            {deck.ring && <Badge variant="secondary">💍 {deck.ring}</Badge>}
            {deck.pet && <Badge variant="secondary">🐾 {deck.pet}</Badge>}
          </div>

          <div className="space-y-2 text-sm">
            {deck.formation && (
              <div>
                <p className="text-xs text-muted-foreground">진형 {deck.formation_type && `(${deck.formation_type})`}</p>
                <p className="font-medium">{deck.formation}</p>
              </div>
            )}
            {deck.skill_order && (
              <div>
                <p className="text-xs text-muted-foreground">스킬 순서</p>
                <p>{deck.skill_order}</p>
              </div>
            )}
            {deck.equipment && (
              <div>
                <p className="text-xs text-muted-foreground">장비 / 특이사항</p>
                <p>{deck.equipment}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleResult("승")}
              disabled={recording}
              className="py-3 rounded-lg font-black text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            >
              🏆 승리
            </button>
            <button
              onClick={() => handleResult("패")}
              disabled={recording}
              className="py-3 rounded-lg font-black text-sm bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
            >
              💀 패배
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
