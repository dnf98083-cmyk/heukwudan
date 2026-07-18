import Link from "next/link";
import { Swords, Calendar, Shield, Zap, Trophy, BookOpen } from "lucide-react";

const FEATURES = [
  {
    href: "/attack",
    icon: Swords,
    label: "길드전 공격",
    desc: "상대 방어팀 공략 확인 및 공격 결과 기록",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/8",
    glow: "hover:border-red-500/60 hover:bg-red-500/12",
  },
  {
    href: "/guild-war",
    icon: Calendar,
    label: "오늘의 길드전",
    desc: "성별 속공 기록 및 상대 속공 추정 확인",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    glow: "hover:border-amber-500/60 hover:bg-amber-500/12",
  },
  {
    href: "/defense",
    icon: Shield,
    label: "방어팀 공략",
    desc: "우리 길드 방어팀 구성과 공략 안 관리",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/8",
    glow: "hover:border-blue-500/60 hover:bg-blue-500/12",
  },
  {
    href: "/speed-calc",
    icon: Zap,
    label: "속공 계산기",
    desc: "전투 순서로 상대 속공 범위 유추",
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/8",
    glow: "hover:border-yellow-500/60 hover:bg-yellow-500/12",
  },
  {
    href: "/records",
    icon: Trophy,
    label: "랭킹",
    desc: "길드원 공격·수비 승률 순위",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    glow: "hover:border-emerald-500/60 hover:bg-emerald-500/12",
  },
  {
    href: "/heroes",
    icon: BookOpen,
    label: "영웅 도감",
    desc: "세나리버스 전체 영웅 정보 확인",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/8",
    glow: "hover:border-purple-500/60 hover:bg-purple-500/12",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* 히어로 배너 */}
      <div className="relative rounded-2xl border border-border/40 bg-gradient-to-br from-red-950/30 via-background to-background overflow-hidden px-6 py-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.08),_transparent_60%)]" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold text-red-400 tracking-[0.2em] uppercase">세븐나이츠 리버스</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">⚔️ 흑우단 공략</h1>
          <p className="text-muted-foreground text-sm mt-1">길드전 공략·기록·분석 통합 관리</p>
        </div>
      </div>

      {/* 기능 그리드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FEATURES.map(({ href, icon: Icon, label, desc, color, border, bg, glow }) => (
          <Link
            key={href}
            href={href}
            className={`group rounded-xl border ${border} ${bg} ${glow} p-4 flex flex-col gap-3 transition-all duration-200`}
          >
            <div className={`w-9 h-9 rounded-lg bg-background/60 border ${border} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className={`text-sm font-bold ${color}`}>{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="rounded-xl border border-border/30 bg-muted/10 px-4 py-3 text-xs text-muted-foreground text-center">
        공격 완료 후 <span className="text-yellow-400 font-semibold">속공 계산기</span>에서 기록을 저장하면{" "}
        <span className="text-amber-400 font-semibold">오늘의 길드전</span>에서 확인할 수 있습니다.
      </div>
    </div>
  );
}
