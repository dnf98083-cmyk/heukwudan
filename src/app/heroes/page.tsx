import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HeroType } from "@/types";

const TYPE_STYLE: Record<HeroType, { label: string; className: string }> = {
  공격형: { label: "공격형", className: "bg-red-500/20 text-red-400" },
  마법형: { label: "마법형", className: "bg-blue-500/20 text-blue-400" },
  지원형: { label: "지원형", className: "bg-yellow-500/20 text-yellow-400" },
  만능형: { label: "만능형", className: "bg-purple-500/20 text-purple-400" },
  방어형: { label: "방어형", className: "bg-amber-800/30 text-amber-700" },
};

const DUMMY_HEROES = [
  { id: "h1", name: "여포", type: "공격형" as HeroType, description: "고단일 딜러" },
  { id: "h2", name: "브브", type: "지원형" as HeroType, description: "버프형 서포터" },
  { id: "h3", name: "칼헬론", type: "방어형" as HeroType, description: "방어형 탱커" },
];

export default function HeroesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={22} />
            영웅 도감
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            등록된 영웅 목록 — 방어팀 공략 검색에 사용됩니다.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          영웅 추가
        </Button>
      </div>

      {/* 타입 범례 */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(TYPE_STYLE) as [HeroType, { label: string; className: string }][]).map(
          ([, { label, className }]) => (
            <span key={label} className={`rounded px-2 py-0.5 text-xs font-medium ${className}`}>
              {label}
            </span>
          )
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DUMMY_HEROES.map((hero) => {
          const typeStyle = hero.type ? TYPE_STYLE[hero.type] : null;
          return (
            <Card key={hero.id} className="hover:bg-accent/20 transition-colors">
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{hero.name}</p>
                  {hero.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{hero.description}</p>
                  )}
                </div>
                {typeStyle && (
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${typeStyle.className}`}>
                    {typeStyle.label}
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
