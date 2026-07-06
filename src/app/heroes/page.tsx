import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ELEMENT_COLOR: Record<string, string> = {
  화: "bg-red-500/20 text-red-400",
  수: "bg-blue-500/20 text-blue-400",
  목: "bg-green-500/20 text-green-400",
  광: "bg-yellow-500/20 text-yellow-400",
  암: "bg-purple-500/20 text-purple-400",
};

const DUMMY_HEROES = [
  { id: "h1", name: "여포", role: "딜러", element: "화", description: "고단일 딜러" },
  { id: "h2", name: "브브", role: "서폿", element: "광", description: "버프형 서포터" },
  { id: "h3", name: "칼헬론", role: "탱커", element: "암", description: "방어형 탱커" },
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
            세나리버스 영웅 정보 모음
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          영웅 추가
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DUMMY_HEROES.map((hero) => (
          <Card key={hero.id} className="hover:bg-accent/20 transition-colors">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{hero.name}</span>
                {hero.element && (
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      ELEMENT_COLOR[hero.element] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {hero.element}
                  </span>
                )}
              </div>
              {hero.role && (
                <Badge variant="outline" className="text-xs">
                  {hero.role}
                </Badge>
              )}
              {hero.description && (
                <p className="text-xs text-muted-foreground">{hero.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
