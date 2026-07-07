import type { HeroType } from "@/types";

export const TYPE_STYLE: Record<HeroType, { label: string; className: string; dot: string }> = {
  공격형: { label: "공격형", className: "bg-red-500/20 text-red-400",     dot: "bg-red-400" },
  마법형: { label: "마법형", className: "bg-blue-500/20 text-blue-400",    dot: "bg-blue-400" },
  지원형: { label: "지원형", className: "bg-yellow-500/20 text-yellow-400", dot: "bg-yellow-400" },
  만능형: { label: "만능형", className: "bg-purple-500/20 text-purple-400", dot: "bg-purple-400" },
  방어형: { label: "방어형", className: "bg-amber-800/30 text-amber-700",   dot: "bg-amber-700" },
};

export const HERO_TYPES = Object.keys(TYPE_STYLE) as HeroType[];
