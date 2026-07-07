export type Role = "일반" | "관리자";
export type Result = "승" | "패";
export type HeroType = "공격형" | "마법형" | "지원형" | "만능형" | "방어형";
export type SpeedType = "속공 따야 함" | "내줘도 됨";
export type FormationType = "기본" | "밸런스" | "공격" | "보호";

export interface GuildMember {
  id: string;
  nickname: string;
  role: Role;
  created_at: string;
}

export interface Hero {
  id: string;
  name: string;
  type: HeroType | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

export interface DefenseTeam {
  id: string;
  title: string;
  hero_names: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
  strategies?: DefenseStrategy[];
}

export interface DefenseStrategy {
  id: string;
  team_id: string;
  strategy_num: number;
  equipment: string | null;
  main_option: string | null;
  stats: string | null;
  note: string | null;
  memo: string | null;
  created_at: string;
}

export interface AttackDeck {
  id: string;
  defense_team_id: string | null;
  name: string;
  speed_type: SpeedType | null;
  ring: string | null;
  pet: string | null;
  formation_type: FormationType | null;
  formation: string | null;
  skill_order: string | null;
  equipment: string | null;
  wins: number;
  losses: number;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GuildWarRecord {
  id: string;
  player_name: string;
  deck_id: string;
  result: Result;
  season: number;
  recorded_at: string;
}

export interface DefenseRecord {
  id: string;
  player_name: string;
  team_id: string | null;
  result: Result;
  opponent: string | null;
  memo: string | null;
  season: number;
  recorded_at: string;
  defense_teams?: Pick<DefenseTeam, "id" | "title">;
}

export interface WinRate {
  player_name: string;
  wins: number;
  losses: number;
  total: number;
  rate: number;
}

// 속공 계산기 슬롯
export interface SpeedSlot {
  team: "ally" | "enemy" | "";
  name: string;
  speed: number;    // 아군만 사용
  type: HeroType;   // 적군만 사용
}
