"use client";

import { useState } from "react";
import { Swords, ChevronDown, Trophy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AttackDeck, FormationType } from "@/types";

// 더미 데이터 — Supabase 연동 전
const DUMMY_DEFENSE_TEAMS = [
  { id: "d1", title: "여포 브브 칼헬론" },
  { id: "d2", title: "루크레치아 마리아나 세실" },
];

const DUMMY_DECKS: AttackDeck[] = [
  {
    id: "a1", defense_team_id: "d1", name: "브브 여포 풍연",
    speed_type: "속공 따야 함", ring: "무기 반지", pet: "불꽃 늑대",
    formation_type: "공격", formation: "브브 여포 풍연",
    skill_order: "브브 → 여포 → 풍연", equipment: "공격력 위주 세팅",
    wins: 8, losses: 2, last_used_at: "2026-07-07", created_by: "흑우1", created_at: "2026-07-01",
  },
  {
    id: "a2", defense_team_id: "d1", name: "세실 마리 브브",
    speed_type: "내줘도 됨", ring: "방어 반지", pet: "얼음 여우",
    formation_type: "밸런스", formation: "세실 마리 브브",
    skill_order: "세실 → 마리 → 브브", equipment: "방어력 세팅",
    wins: 5, losses: 5, last_used_at: "2026-07-06", created_by: "흑우2", created_at: "2026-07-01",
  },
];

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

export default function AttackPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("winrate");
  const [selectedDeck, setSelectedDeck] = useState<AttackDeck | null>(null);

  const selectedTeam = DUMMY_DEFENSE_TEAMS.find((t) => t.id === selectedTeamId);
  const filteredTeams = DUMMY_DEFENSE_TEAMS.filter((t) =>
    t.title.includes(search)
  );

  const decks = sortDecks(
    DUMMY_DECKS.filter((d) => d.defense_team_id === selectedTeamId),
    sort
  );

  // 시즌 랭킹 (전체 덱 기준)
  const ranking = sortDecks(DUMMY_DECKS, "winrate").slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Swords size={22} />
          길드전 공격기록
        </h1>
        <Button size="sm" className="gap-1.5">
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
                      selectedTeamId === t.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
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
        <p className="text-center text-muted-foreground text-sm py-12">위에서 방어팀을 선택하면 공략이 표시됩니다.</p>
      ) : decks.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">등록된 공격덱이 없습니다.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {decks.map((deck) => {
            const rate = winRate(deck);
            return (
              <button
                key={deck.id}
                onClick={() => setSelectedDeck(deck)}
                className="text-left"
              >
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
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy size={15} className="text-yellow-400" />
            시즌 랭킹
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
              <span className={cn(
                "font-bold shrink-0",
                winRate(deck) >= 70 ? "text-green-400" : "text-muted-foreground"
              )}>
                {winRate(deck)}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 공격덱 상세 다이얼로그 */}
      <DeckDialog deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
    </div>
  );
}

function DeckDialog({ deck, onClose }: { deck: AttackDeck | null; onClose: () => void }) {
  const [recording, setRecording] = useState(false);

  async function handleResult(result: "승" | "패") {
    setRecording(true);
    // TODO: Supabase 연동 후 실제 저장
    await new Promise((r) => setTimeout(r, 400));
    setRecording(false);
    onClose();
  }

  if (!deck) return null;
  const rate = winRate(deck);

  return (
    <Dialog open={!!deck} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <div className="space-y-4">
          {/* 헤더 */}
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

          {/* 정보 칩 */}
          <div className="flex flex-wrap gap-2">
            {deck.speed_type && (
              <Badge variant="outline" className={deck.speed_type === "속공 따야 함" ? "border-yellow-500 text-yellow-400" : ""}>
                ⚡ {deck.speed_type}
              </Badge>
            )}
            {deck.ring && <Badge variant="secondary">💍 {deck.ring}</Badge>}
            {deck.pet && <Badge variant="secondary">🐾 {deck.pet}</Badge>}
          </div>

          {/* 상세 정보 */}
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

          {/* 승리 / 패배 버튼 */}
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
