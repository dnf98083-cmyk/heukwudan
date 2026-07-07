"use client";

import { useState } from "react";
import { Shield, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DUMMY_TEAMS = [
  {
    id: "1",
    title: "여포 브브 칼헬론",
    hero_names: ["여포", "브브", "칼헬론"],
    strategies: [
      { id: "s1", strategy_num: 1, equipment: "성검 세트", main_option: "공격력", stats: "공/치/치피", note: "치명타 위주 세팅", memo: "브브 버프 타이밍 주의" },
      { id: "s2", strategy_num: 2, equipment: "용갑 세트", main_option: "방어력", stats: "방/체/저", note: "탱킹 위주", memo: "" },
    ],
  },
  {
    id: "2",
    title: "루크레치아 마리아나 세실",
    hero_names: ["루크레치아", "마리아나", "세실"],
    strategies: [
      { id: "s3", strategy_num: 1, equipment: "마법 세트", main_option: "마법력", stats: "마/속/관", note: "속공 위주", memo: "" },
    ],
  },
];

export default function DefensePage() {
  const [query, setQuery] = useState("");

  const filtered = DUMMY_TEAMS.filter(
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
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          팀 추가
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="영웅 이름 또는 팀명 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">검색 결과가 없습니다.</p>
      ) : (
        <div className="grid gap-6">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: (typeof DUMMY_TEAMS)[0] }) {
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
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">수정</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {team.strategies.map((s) => (
          <div key={s.id} className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">{s.strategy_num}안</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">수정</Button>
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
        ))}
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
          <Plus size={12} />공략 안 추가
        </Button>
      </CardContent>
    </Card>
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
