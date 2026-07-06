import Link from "next/link";
import { Shield, Swords, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    href: "/defense",
    icon: Shield,
    title: "방어팀 공략",
    description: "영웅 조합별 장비, 메인옵, 스탯 공략을 확인하세요.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    href: "/records",
    icon: Swords,
    title: "수비 기록",
    description: "길드원 수비 승패 기록 및 시즌 승률을 확인하세요.",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  {
    href: "/heroes",
    icon: BookOpen,
    title: "영웅 도감",
    description: "세나리버스 영웅 정보를 한눈에 확인하세요.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 py-8">
        <h1 className="text-3xl font-bold tracking-tight">⚔️ 흑우단 공략</h1>
        <p className="text-muted-foreground">세븐나이츠 리버스 길드 공략 허브</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map(({ href, icon: Icon, title, description, color, bg }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-accent/30 cursor-pointer">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={20} className={color} />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp size={16} />
            공지 / 업데이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            흑우단 공략 사이트에 오신 것을 환영합니다. 방어팀 공략을 확인하거나 수비 기록을 남겨보세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
