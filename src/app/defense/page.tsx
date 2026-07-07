"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { DefenseTeam, DefenseStrategy } from "@/types";

export default function DefensePage() {
  const [teams, setTeams] = useState<DefenseTeam[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("defense_teams")
      .select("*, strategies:defense_strategies(*)")
      .order("display_order")
      .then(({ data }) => {
        setTeams(data ?? []);
        setLoading(false);
      });
  }, []);

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
        <Button size="sm" className="gap-1.5">
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
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: DefenseTeam }) {
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
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">수정</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {strategies.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">등록된 공략 안이 없습니다.</p>
        ) : (
          strategies.map((s) => (
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
          ))
        )}
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
