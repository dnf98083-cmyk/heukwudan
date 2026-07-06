import { Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 나중에 Supabase에서 가져올 데이터 — 지금은 UI 구조 확인용 더미 데이터
const DUMMY_TEAMS = [
  {
    id: "1",
    title: "여포 브브 칼헬론",
    hero_names: ["여포", "브브", "칼헬론"],
    strategies: [
      {
        id: "s1",
        strategy_num: 1,
        equipment: "성검 세트",
        main_option: "공격력",
        stats: "공/치/치피",
        note: "치명타 위주 세팅",
        memo: "브브 버프 타이밍 주의",
      },
      {
        id: "s2",
        strategy_num: 2,
        equipment: "용갑 세트",
        main_option: "방어력",
        stats: "방/체/저",
        note: "탱킹 위주",
        memo: "",
      },
    ],
  },
];

export default function DefensePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={22} />
            방어팀 공략
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            방어팀 구성별 공략 안을 확인하세요.
          </p>
        </div>
        {/* 관리자일 때만 보임 — 나중에 세션으로 조건 처리 */}
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          공략 추가
        </Button>
      </div>

      <div className="grid gap-6">
        {DUMMY_TEAMS.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
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
            <div className="flex gap-1.5 mt-1.5">
              {team.hero_names.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
          {/* 관리자 전용 수정 버튼 — 나중에 조건부 */}
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            수정
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {team.strategies.map((s) => (
          <StrategyRow key={s.id} strategy={s} />
        ))}

        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
          <Plus size={12} />
          공략 안 추가
        </Button>
      </CardContent>
    </Card>
  );
}

function StrategyRow({ strategy }: { strategy: (typeof DUMMY_TEAMS)[0]["strategies"][0] }) {
  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">
          {strategy.strategy_num}안
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
          수정
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
        <InfoItem label="장비" value={strategy.equipment} />
        <InfoItem label="메인옵" value={strategy.main_option} />
        <InfoItem label="스탯" value={strategy.stats} />
        <InfoItem label="특이사항" value={strategy.note} />
      </div>

      {strategy.memo && (
        <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">
          📝 {strategy.memo}
        </p>
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
